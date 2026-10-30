import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware.ts';
import { dbStore } from '../db/store.ts';
import { executeAiCopilotChat } from '../services/ai_copilot.service.ts';

const router = Router();
router.use(authMiddleware);

// GET /api/v1/copilot/history
router.get('/history', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const messages = dbStore.getChatMessages(userId);
    res.json({ success: true, data: messages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/copilot/chat
router.post('/chat', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ success: false, error: 'A valid text message is required.' });
      return;
    }

    // Record user message
    dbStore.addChatMessage(userId, {
      role: 'user',
      content: message.trim(),
    });

    // Execute agentic copilot workflow
    const result = await executeAiCopilotChat(userId, message.trim());

    // Record assistant message
    const savedAssistantMsg = dbStore.addChatMessage(userId, {
      role: 'assistant',
      content: result.answer,
      proposedAction: result.proposedAction,
      toolInvocations: result.toolInvocations,
    });

    dbStore.recordAuditEvent(userId, 'COPILOT_CHAT', `Invoked AI assistant: "${message.trim().substring(0, 40)}..."`);

    res.json({
      success: true,
      data: savedAssistantMsg,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/copilot/action/confirm
router.post('/action/confirm', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { actionId } = req.body;

    if (!actionId) {
      res.status(400).json({ success: false, error: 'Action ID is required.' });
      return;
    }

    // Locate action in messages
    const messages = dbStore.getChatMessages(userId);
    const targetMsg = messages.find(m => m.proposedAction && m.proposedAction.id === actionId);

    if (!targetMsg || !targetMsg.proposedAction) {
      res.status(404).json({ success: false, error: 'Proposed action not found or expired.' });
      return;
    }

    const action = targetMsg.proposedAction;
    if (action.status !== 'PENDING_CONFIRMATION') {
      res.status(400).json({ success: false, error: `Action has already been ${action.status}.` });
      return;
    }

    // Execute approved state mutation
    if (action.type === 'CREATE_BUDGET') {
      const { category, amount, warningThreshold = 0.8 } = action.payload;
      const budget = dbStore.createBudget(userId, {
        category,
        amount,
        warningThreshold,
      });

      dbStore.updateProposedActionStatus(userId, actionId, 'EXECUTED');
      dbStore.recordAuditEvent(
        userId,
        'AGENTIC_ACTION_EXECUTED',
        `User confirmed creation of budget for ${category} at ${amount}`
      );

      // Add audit feedback message into chat
      dbStore.addChatMessage(userId, {
        role: 'system',
        content: `✅ Action executed: Successfully established budget limit of ${amount} for ${category}.`,
      });

      res.json({
        success: true,
        data: {
          actionId,
          status: 'EXECUTED',
          result: budget,
        },
      });
      return;
    }

    res.status(400).json({ success: false, error: 'Unknown action type.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/copilot/action/reject
router.post('/action/reject', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { actionId } = req.body;

    if (!actionId) {
      res.status(400).json({ success: false, error: 'Action ID is required.' });
      return;
    }

    dbStore.updateProposedActionStatus(userId, actionId, 'REJECTED');
    dbStore.recordAuditEvent(userId, 'AGENTIC_ACTION_REJECTED', `User rejected proposed action ${actionId}`);

    dbStore.addChatMessage(userId, {
      role: 'system',
      content: '❌ Proposed action was cancelled by user.',
    });

    res.json({ success: true, message: 'Action proposal rejected.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/copilot/history
router.delete('/history', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    dbStore.clearChat(userId);
    res.json({ success: true, message: 'Copilot chat history cleared.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
