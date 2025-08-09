import type { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import {
  insertRiskScoreSchema,
  insertUserAlertSchema,
  insertPoolReviewSchema,
  insertReviewVoteSchema,
  insertStrategySchema,
  insertStrategyPoolSchema,
  insertDiscussionSchema,
  insertDiscussionReplySchema,


  insertApiEndpointSchema,
  insertDeveloperApplicationSchema
} from "@shared/schema";

export function registerAdvancedRoutes(app: Express) {
  // 1. Risk Scoring API Routes
  app.get('/api/pools/:poolId/risk-score', async (req, res) => {
    try {
      const { poolId } = req.params;
      
      let riskScore = await storage.getRiskScore(poolId);
      
      // Calculate if not exists or outdated (older than 24 hours)
      if (!riskScore || (riskScore.updatedAt && new Date(riskScore.updatedAt).getTime() < Date.now() - 24 * 60 * 60 * 1000)) {
        riskScore = await storage.calculateAndStoreRiskScore(poolId);
      }
      
      res.json(riskScore);
    } catch (error) {
      console.error('Error getting risk score:', error);
      res.status(500).json({ message: 'Failed to get risk score' });
    }
  });

  app.post('/api/pools/:poolId/calculate-risk', async (req, res) => {
    try {
      const { poolId } = req.params;
      const riskScore = await storage.calculateAndStoreRiskScore(poolId);
      res.json(riskScore);
    } catch (error) {
      console.error('Error calculating risk score:', error);
      res.status(500).json({ message: 'Failed to calculate risk score' });
    }
  });

  // 2. Smart Alerts API Routes
  app.post('/api/users/:userId/alerts', async (req, res) => {
    try {
      const { userId } = req.params;
      const alertData = insertUserAlertSchema.parse({ ...req.body, userId });
      
      const alert = await storage.createUserAlert(alertData);
      res.status(201).json(alert);
    } catch (error) {
      console.error('Error creating alert:', error);
      res.status(400).json({ message: 'Failed to create alert' });
    }
  });

  app.get('/api/users/:userId/alerts', async (req, res) => {
    try {
      const { userId } = req.params;
      const { active } = req.query;
      
      const isActive = active === 'true' ? true : active === 'false' ? false : undefined;
      const alerts = await storage.getUserAlerts(userId, isActive);
      
      res.json(alerts);
    } catch (error) {
      console.error('Error getting alerts:', error);
      res.status(500).json({ message: 'Failed to get alerts' });
    }
  });

  app.put('/api/alerts/:alertId', async (req, res) => {
    try {
      const { alertId } = req.params;
      const updateData = req.body;
      
      const alert = await storage.updateUserAlert(alertId, updateData);
      if (!alert) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      
      res.json(alert);
    } catch (error) {
      console.error('Error updating alert:', error);
      res.status(400).json({ message: 'Failed to update alert' });
    }
  });

  app.delete('/api/alerts/:alertId', async (req, res) => {
    try {
      const { alertId } = req.params;
      const deleted = await storage.deleteUserAlert(alertId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting alert:', error);
      res.status(500).json({ message: 'Failed to delete alert' });
    }
  });

  app.get('/api/users/:userId/notifications', async (req, res) => {
    try {
      const { userId } = req.params;
      const { read } = req.query;
      
      const isRead = read === 'true' ? true : read === 'false' ? false : undefined;
      const notifications = await storage.getUserNotifications(userId, isRead);
      
      res.json(notifications);
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ message: 'Failed to get notifications' });
    }
  });

  app.put('/api/notifications/:notificationId/read', async (req, res) => {
    try {
      const { notificationId } = req.params;
      const success = await storage.markNotificationAsRead(notificationId);
      
      if (!success) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

  // 3. User Reviews & Ratings API Routes
  app.post('/api/pools/:poolId/reviews', async (req, res) => {
    try {
      const { poolId } = req.params;
      const reviewData = insertPoolReviewSchema.parse({ ...req.body, poolId });
      
      const review = await storage.createPoolReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(400).json({ message: 'Failed to create review' });
    }
  });

  app.get('/api/pools/:poolId/reviews', async (req, res) => {
    try {
      const { poolId } = req.params;
      const reviews = await storage.getPoolReviews(poolId);
      res.json(reviews);
    } catch (error) {
      console.error('Error getting reviews:', error);
      res.status(500).json({ message: 'Failed to get reviews' });
    }
  });

  app.get('/api/pools/:poolId/rating', async (req, res) => {
    try {
      const { poolId } = req.params;
      const rating = await storage.getPoolRating(poolId);
      res.json(rating);
    } catch (error) {
      console.error('Error getting pool rating:', error);
      res.status(500).json({ message: 'Failed to get pool rating' });
    }
  });

  app.put('/api/reviews/:reviewId', async (req, res) => {
    try {
      const { reviewId } = req.params;
      const updateData = req.body;
      
      const review = await storage.updatePoolReview(reviewId, updateData);
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }
      
      res.json(review);
    } catch (error) {
      console.error('Error updating review:', error);
      res.status(400).json({ message: 'Failed to update review' });
    }
  });

  app.delete('/api/reviews/:reviewId', async (req, res) => {
    try {
      const { reviewId } = req.params;
      const deleted = await storage.deletePoolReview(reviewId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Review not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting review:', error);
      res.status(500).json({ message: 'Failed to delete review' });
    }
  });

  app.post('/api/reviews/:reviewId/vote', async (req, res) => {
    try {
      const { reviewId } = req.params;
      const voteData = insertReviewVoteSchema.parse({ ...req.body, reviewId });
      
      const vote = await storage.voteOnReview(voteData);
      res.status(201).json(vote);
    } catch (error) {
      console.error('Error voting on review:', error);
      res.status(400).json({ message: 'Failed to vote on review' });
    }
  });

  app.delete('/api/reviews/:reviewId/vote/:userId', async (req, res) => {
    try {
      const { reviewId, userId } = req.params;
      const deleted = await storage.removeReviewVote(reviewId, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Vote not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error removing vote:', error);
      res.status(500).json({ message: 'Failed to remove vote' });
    }
  });

  // 4. Community Insights API Routes (Strategies)
  app.post('/api/strategies', async (req, res) => {
    try {
      const strategyData = insertStrategySchema.parse(req.body);
      const strategy = await storage.createStrategy(strategyData);
      res.status(201).json(strategy);
    } catch (error) {
      console.error('Error creating strategy:', error);
      res.status(400).json({ message: 'Failed to create strategy' });
    }
  });

  app.get('/api/strategies', async (req, res) => {
    try {
      const { userId, category, riskLevel, isPublic } = req.query;
      
      const options: any = {};
      if (userId) options.userId = String(userId);
      if (category) options.category = String(category);
      if (riskLevel) options.riskLevel = String(riskLevel);
      if (isPublic !== undefined) options.isPublic = isPublic === 'true';
      
      const strategies = await storage.getStrategies(options);
      res.json(strategies);
    } catch (error) {
      console.error('Error getting strategies:', error);
      res.status(500).json({ message: 'Failed to get strategies' });
    }
  });

  app.get('/api/strategies/:strategyId', async (req, res) => {
    try {
      const { strategyId } = req.params;
      const strategy = await storage.getStrategy(strategyId);
      
      if (!strategy) {
        return res.status(404).json({ message: 'Strategy not found' });
      }
      
      res.json(strategy);
    } catch (error) {
      console.error('Error getting strategy:', error);
      res.status(500).json({ message: 'Failed to get strategy' });
    }
  });

  app.put('/api/strategies/:strategyId', async (req, res) => {
    try {
      const { strategyId } = req.params;
      const updateData = req.body;
      
      const strategy = await storage.updateStrategy(strategyId, updateData);
      if (!strategy) {
        return res.status(404).json({ message: 'Strategy not found' });
      }
      
      res.json(strategy);
    } catch (error) {
      console.error('Error updating strategy:', error);
      res.status(400).json({ message: 'Failed to update strategy' });
    }
  });

  app.delete('/api/strategies/:strategyId', async (req, res) => {
    try {
      const { strategyId } = req.params;
      const deleted = await storage.deleteStrategy(strategyId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Strategy not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting strategy:', error);
      res.status(500).json({ message: 'Failed to delete strategy' });
    }
  });

  app.post('/api/strategies/:strategyId/pools', async (req, res) => {
    try {
      const { strategyId } = req.params;
      const poolData = insertStrategyPoolSchema.parse({ ...req.body, strategyId });
      
      const strategyPool = await storage.addPoolToStrategy(poolData);
      res.status(201).json(strategyPool);
    } catch (error) {
      console.error('Error adding pool to strategy:', error);
      res.status(400).json({ message: 'Failed to add pool to strategy' });
    }
  });

  app.delete('/api/strategies/:strategyId/pools/:poolId', async (req, res) => {
    try {
      const { strategyId, poolId } = req.params;
      const deleted = await storage.removePoolFromStrategy(strategyId, poolId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Pool not found in strategy' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error removing pool from strategy:', error);
      res.status(500).json({ message: 'Failed to remove pool from strategy' });
    }
  });

  app.post('/api/strategies/:strategyId/upvote', async (req, res) => {
    try {
      const { strategyId } = req.params;
      await storage.upvoteStrategy(strategyId);
      res.status(204).send();
    } catch (error) {
      console.error('Error upvoting strategy:', error);
      res.status(500).json({ message: 'Failed to upvote strategy' });
    }
  });

  // Community Discussions
  app.post('/api/discussions', async (req, res) => {
    try {
      const discussionData = insertDiscussionSchema.parse(req.body);
      const discussion = await storage.createDiscussion(discussionData);
      res.status(201).json(discussion);
    } catch (error) {
      console.error('Error creating discussion:', error);
      res.status(400).json({ message: 'Failed to create discussion' });
    }
  });

  app.get('/api/discussions', async (req, res) => {
    try {
      const { poolId, strategyId, category } = req.query;
      
      const options: any = {};
      if (poolId) options.poolId = String(poolId);
      if (strategyId) options.strategyId = String(strategyId);
      if (category) options.category = String(category);
      
      const discussions = await storage.getDiscussions(options);
      res.json(discussions);
    } catch (error) {
      console.error('Error getting discussions:', error);
      res.status(500).json({ message: 'Failed to get discussions' });
    }
  });

  app.post('/api/discussions/:discussionId/replies', async (req, res) => {
    try {
      const { discussionId } = req.params;
      const replyData = insertDiscussionReplySchema.parse({ ...req.body, discussionId });
      
      const reply = await storage.createDiscussionReply(replyData);
      res.status(201).json(reply);
    } catch (error) {
      console.error('Error creating discussion reply:', error);
      res.status(400).json({ message: 'Failed to create discussion reply' });
    }
  });





  // 5. API Marketplace Routes
  app.get('/api/marketplace/endpoints', async (req, res) => {
    try {
      const { category, accessLevel } = req.query;
      
      const endpoints = await storage.getApiEndpoints(
        category ? String(category) : undefined,
        accessLevel ? String(accessLevel) : undefined
      );
      
      res.json(endpoints);
    } catch (error) {
      console.error('Error getting API endpoints:', error);
      res.status(500).json({ message: 'Failed to get API endpoints' });
    }
  });

  app.get('/api/marketplace/endpoints/:endpointId', async (req, res) => {
    try {
      const { endpointId } = req.params;
      const endpoint = await storage.getApiEndpoint(endpointId);
      
      if (!endpoint) {
        return res.status(404).json({ message: 'API endpoint not found' });
      }
      
      res.json(endpoint);
    } catch (error) {
      console.error('Error getting API endpoint:', error);
      res.status(500).json({ message: 'Failed to get API endpoint' });
    }
  });

  app.post('/api/marketplace/apply', async (req, res) => {
    try {
      const applicationData = insertDeveloperApplicationSchema.parse(req.body);
      const application = await storage.createDeveloperApplication(applicationData);
      res.status(201).json(application);
    } catch (error) {
      console.error('Error creating developer application:', error);
      res.status(400).json({ message: 'Failed to create developer application' });
    }
  });

  app.get('/api/marketplace/applications', async (req, res) => {
    try {
      const { status } = req.query;
      const applications = await storage.getDeveloperApplications(
        status ? String(status) : undefined
      );
      res.json(applications);
    } catch (error) {
      console.error('Error getting developer applications:', error);
      res.status(500).json({ message: 'Failed to get developer applications' });
    }
  });

  app.put('/api/marketplace/applications/:applicationId/status', async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { status } = req.body;
      
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const application = await storage.updateDeveloperApplication(applicationId, status);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      res.json(application);
    } catch (error) {
      console.error('Error updating application status:', error);
      res.status(400).json({ message: 'Failed to update application status' });
    }
  });

  // Admin routes for API endpoints
  app.post('/api/admin/marketplace/endpoints', async (req, res) => {
    try {
      const endpointData = insertApiEndpointSchema.parse(req.body);
      const endpoint = await storage.createApiEndpoint(endpointData);
      res.status(201).json(endpoint);
    } catch (error) {
      console.error('Error creating API endpoint:', error);
      res.status(400).json({ message: 'Failed to create API endpoint' });
    }
  });

  app.put('/api/admin/marketplace/endpoints/:endpointId', async (req, res) => {
    try {
      const { endpointId } = req.params;
      const updateData = req.body;
      
      const endpoint = await storage.updateApiEndpoint(endpointId, updateData);
      if (!endpoint) {
        return res.status(404).json({ message: 'API endpoint not found' });
      }
      
      res.json(endpoint);
    } catch (error) {
      console.error('Error updating API endpoint:', error);
      res.status(400).json({ message: 'Failed to update API endpoint' });
    }
  });

  app.delete('/api/admin/marketplace/endpoints/:endpointId', async (req, res) => {
    try {
      const { endpointId } = req.params;
      const deleted = await storage.deleteApiEndpoint(endpointId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'API endpoint not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting API endpoint:', error);
      res.status(500).json({ message: 'Failed to delete API endpoint' });
    }
  });
}