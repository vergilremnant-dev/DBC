import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import indexHandler from './routes/categories/index.js';
import slugOrIdHandler from './routes/categories/[slugOrId].js';
import categoriesTreeHandler from './routes/categories/tree.js';
import categoriesFeaturedHandler from './routes/categories/featured.js';
import categoriesReorderHandler from './routes/categories/reorder.js';
import loginHandler from './routes/auth/login.js';
import socialLoginHandler from './routes/auth/social-login.js';
import refreshHandler from './routes/auth/refresh.js';
import logoutHandler from './routes/auth/logout.js';
import logoutAllHandler from './routes/auth/logout-all.js';
import sessionsHandler from './routes/auth/sessions.js';
import registerHandler from './routes/auth/register.js';
import verifyEmailHandler from './routes/auth/verify-email.js';
import forgotPasswordHandler from './routes/auth/forgot-password.js';
import resetPasswordHandler from './routes/auth/reset-password.js';
import changePasswordHandler from './routes/auth/change-password.js';
import complianceHandler from './routes/compliance/index.js';
import healthHandler from './routes/health/index.js';
import customerProfileHandler from './routes/customer/profile.js';
import contractorProfileHandler from './routes/contractor/profile.js';
import profileHandler from './routes/profile/index.js';
import uploadHandler from './routes/profile/upload.js';
import completionHandler from './routes/profile/completion.js';
import providersIndexHandler from './routes/providers/index.js';
import providersProfileHandler from './routes/providers/profile.js';
import providersDetailHandler from './routes/providers/[id]/index.js';
import providersVerifyHandler from './routes/providers/[id]/verify.js';
import providersFeatureHandler from './routes/providers/[id]/feature.js';
import providersStatusHandler from './routes/providers/[id]/status.js';
import searchIndexHandler from './routes/search/index.js';
import searchProvidersHandler from './routes/search/providers.js';
import searchFeaturedHandler from './routes/search/featured.js';
import searchRecommendedHandler from './routes/search/recommended.js';
import searchRecommendationsHandler from './routes/search/recommendations.js';
import searchSuggestionsHandler from './routes/search/suggestions.js';
import requirementsIndexHandler from './routes/requirements/index.js';
import requirementsMyHandler from './routes/requirements/my.js';
import requirementsDetailHandler from './routes/requirements/[id]/index.js';
import requirementsStatusHandler from './routes/requirements/[id]/status.js';
import requirementsNotesHandler from './routes/requirements/[id]/notes.js';
import requirementsAttachmentsHandler from './routes/requirements/[id]/attachments.js';
import quotationsIndexHandler from './routes/quotations/index.js';
import quotationsCompareHandler from './routes/quotations/compare.js';
import quotationsDetailHandler from './routes/quotations/[id]/index.js';
import quotationsStatusHandler from './routes/quotations/[id]/status.js';
import quotationsNegotiateHandler from './routes/quotations/[id]/negotiate.js';
import quotationsReviseHandler from './routes/quotations/[id]/revise.js';
import projectsIndexHandler from './routes/projects/index.js';
import projectsDetailHandler from './routes/projects/[id]/index.js';
import projectsWorkOrdersHandler from './routes/projects/[id]/work-orders.js';
import projectsMilestonesHandler from './routes/projects/[id]/milestones.js';
import projectsResourcesHandler from './routes/projects/[id]/resources.js';
import projectsProgressHandler from './routes/projects/[id]/progress.js';
import projectsApprovalsHandler from './routes/projects/[id]/approvals.js';
import appointmentsIndexHandler from './routes/appointments/index.js';
import appointmentsAvailabilityHandler from './routes/appointments/availability.js';
import appointmentsDetailHandler from './routes/appointments/[id]/index.js';
import appointmentsStatusHandler from './routes/appointments/[id]/status.js';
import bookingsIndexHandler from './routes/bookings/index.js';
import bookingsMyHandler from './routes/bookings/my.js';
import bookingsDetailHandler from './routes/bookings/[id]/index.js';
import conversationsIndexHandler from './routes/conversations/index.js';
import conversationsPresenceHandler from './routes/conversations/presence.js';
import conversationsDetailHandler from './routes/conversations/[id]/index.js';
import conversationsMessagesHandler from './routes/conversations/[id]/messages.js';
import conversationsReadHandler from './routes/conversations/[id]/read.js';
import activitiesIndexHandler from './routes/activities/index.js';
import announcementsIndexHandler from './routes/announcements/index.js';
import workforceTypesHandler from './routes/workforce/types.js';
import workforceCategoriesHandler from './routes/workforce/categories.js';
import bookingsCancelHandler from './routes/bookings/[id]/cancel.js';
import providerBookingsIndexHandler from './routes/provider/bookings/index.js';
import providerBookingsAcceptHandler from './routes/provider/bookings/[id]/accept.js';
import providerBookingsRejectHandler from './routes/provider/bookings/[id]/reject.js';
import providerBookingsStartHandler from './routes/provider/bookings/[id]/start.js';
import providerBookingsCompleteHandler from './routes/provider/bookings/[id]/complete.js';
import adminBookingsIndexHandler from './routes/admin/bookings/index.js';
import adminBookingsUpdateHandler from './routes/admin/bookings/[id].js';
import subscriptionsPlansHandler from './routes/subscriptions/plans.js';
import subscriptionsMyHandler from './routes/subscriptions/my.js';
import subscriptionsActivateHandler from './routes/subscriptions/activate.js';
import subscriptionsCancelHandler from './routes/subscriptions/cancel.js';
import adminPlansIndexHandler from './routes/admin/subscriptions/plans/index.js';
import adminPlansDetailHandler from './routes/admin/subscriptions/plans/[id].js';
import subscriptionsCreateOrderHandler from './routes/subscriptions/create-order.js';
import subscriptionsVerifyPaymentHandler from './routes/subscriptions/verify-payment.js';
import subscriptionsWebhookHandler from './routes/subscriptions/webhook.js';

// Consultation Handler Imports
import consultationsIndexHandler from './routes/consultations/index.js';
import consultationsDetailHandler from './routes/consultations/[id]/index.js';
import consultationsCancelHandler from './routes/consultations/[id]/cancel.js';
import providerConsultationsIndexHandler from './routes/provider/consultations/index.js';
import providerConsultationsAcceptHandler from './routes/provider/consultations/[id]/accept.js';
import providerConsultationsRejectHandler from './routes/provider/consultations/[id]/reject.js';
import providerConsultationsRescheduleHandler from './routes/provider/consultations/[id]/reschedule.js';
import providerConsultationsCompleteHandler from './routes/provider/consultations/[id]/complete.js';
import providerAvailabilityHandler from './routes/provider/availability.js';
import adminConsultationsIndexHandler from './routes/admin/consultations/index.js';
import adminConsultationsDetailHandler from './routes/admin/consultations/[id].js';

// Callback Handler Imports
import publicCallbacksIndexHandler from './routes/callbacks/index.js';
import publicCallbacksStatusHandler from './routes/callbacks/status.js';
import adminCallbacksIndexHandler from './routes/admin/callbacks/index.js';
import adminCallbacksDetailHandler from './routes/admin/callbacks/[id]/index.js';
import adminCallbacksAssignHandler from './routes/admin/callbacks/[id]/assign.js';
import adminCallbacksStatusHandler from './routes/admin/callbacks/[id]/status.js';
import adminCallbacksNotesHandler from './routes/admin/callbacks/[id]/notes.js';
import adminCallbacksAnalyticsHandler from './routes/admin/callbacks/analytics.js';
import providerCallbacksIndexHandler from './routes/provider/callbacks/index.js';
import providerCallbacksContactedHandler from './routes/provider/callbacks/[id]/contacted.js';
import providerCallbacksConsultationBookedHandler from './routes/provider/callbacks/[id]/consultation-booked.js';
import providerCallbacksServiceBookedHandler from './routes/provider/callbacks/[id]/service-booked.js';

// Provider Dashboard Handler Imports
import providerDashboardIndexHandler from './routes/provider/dashboard/index.js';
import providerPerformanceHandler from './routes/provider/performance/index.js';
import providerCalendarIndexHandler from './routes/provider/calendar/index.js';
import providerCalendarBlockedDatesHandler from './routes/provider/calendar/blocked-dates.js';
import providerCalendarAvailabilityHandler from './routes/provider/calendar/availability.js';

// Reviews Handler Imports
import publicReviewsListHandler from './routes/providers/[id]/reviews.js';
import publicRatingSummaryHandler from './routes/providers/[id]/rating-summary.js';
import customerReviewsIndexHandler from './routes/reviews/index.js';
import customerReviewsMyHandler from './routes/reviews/my.js';
import customerReviewsDetailHandler from './routes/reviews/[id]/index.js';
import providerReviewsReplyHandler from './routes/provider/reviews/[id]/reply.js';
import providerReviewsIndexHandler from './routes/provider/reviews/index.js';
import adminReviewsIndexHandler from './routes/admin/reviews/index.js';
import adminReviewsHideHandler from './routes/admin/reviews/[id]/hide.js';
import adminReviewsRestoreHandler from './routes/admin/reviews/[id]/restore.js';
import adminReviewsDetailHandler from './routes/admin/reviews/[id]/index.js';

// Articles Handler Imports
import publicArticlesIndexHandler from './routes/articles/index.js';
import publicArticlesFeaturedHandler from './routes/articles/featured.js';
import publicArticlesDetailHandler from './routes/articles/[slug]/index.js';
import publicArticlesCategoryHandler from './routes/articles/category/[slug].js';
import publicArticlesCategoriesHandler from './routes/articles/categories.js';
import publicArticlesTrackHandler from './routes/articles/[slug]/track.js';
import adminArticlesIndexHandler from './routes/admin/articles/index.js';
import adminArticlesDetailHandler from './routes/admin/articles/[id].js';
import adminArticlesCategoriesIndexHandler from './routes/admin/categories/index.js';
import adminArticlesCategoriesDetailHandler from './routes/admin/categories/[id].js';
import adminArticlesAnalyticsHandler from './routes/admin/articles/analytics.js';

// Admin Analytics Handler Imports
import adminAnalyticsOverviewHandler from './routes/admin/analytics/overview.js';
import adminAnalyticsBookingsHandler from './routes/admin/analytics/bookings.js';
import adminAnalyticsProvidersHandler from './routes/admin/analytics/providers.js';
import adminAnalyticsCustomersHandler from './routes/admin/analytics/customers.js';
import adminAnalyticsSubscriptionsHandler from './routes/admin/analytics/subscriptions.js';
import adminAnalyticsConsultationsHandler from './routes/admin/analytics/consultations.js';
import adminAnalyticsCallbacksHandler from './routes/admin/analytics/callbacks.js';
import adminAnalyticsContentHandler from './routes/admin/analytics/content.js';

// New Admin Handler Imports
import adminUsersIndexHandler from './routes/admin/users/index.js';
import adminUsersDetailHandler from './routes/admin/users/[id].js';
import adminProvidersIndexHandler from './routes/admin/providers/index.js';
import adminSubscriptionsIndexHandler from './routes/admin/subscriptions/index.js';

// Chat Handler Imports
import chatConversationsIndexHandler from './routes/chat/conversations/index.js';
import chatConversationsDetailHandler from './routes/chat/conversations/[id].js';
import chatMessagesIndexHandler from './routes/chat/messages/index.js';
import chatMessagesFetchHandler from './routes/chat/messages/[conversationId].js';
import chatMessagesReadHandler from './routes/chat/messages/[id]/read.js';

const app = express();
app.use((req, res, next) => {
  if (req.body !== undefined) {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Request adapter to map Express requests and responses to Vercel format
const adapt = (handler) => async (req, res) => {
  const queryVal = Object.assign({}, req.query, req.params);
  Object.defineProperty(req, 'query', {
    value: queryVal,
    writable: true,
    configurable: true
  });
  try {
    await handler(req, res);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

app.get('/api/categories', adapt(indexHandler));
app.post('/api/categories', adapt(indexHandler));
app.get('/api/categories/tree', adapt(categoriesTreeHandler));
app.get('/api/categories/featured', adapt(categoriesFeaturedHandler));
app.post('/api/categories/reorder', adapt(categoriesReorderHandler));
app.get('/api/categories/:slugOrId', adapt(slugOrIdHandler));
app.put('/api/categories/:slugOrId', adapt(slugOrIdHandler));
app.delete('/api/categories/:slugOrId', adapt(slugOrIdHandler));
app.post('/api/auth/login', adapt(loginHandler));
app.post('/api/auth/social-login', adapt(socialLoginHandler));
app.post('/api/auth/refresh', adapt(refreshHandler));
app.post('/api/auth/logout', adapt(logoutHandler));
app.post('/api/auth/logout-all', adapt(logoutAllHandler));
app.get('/api/auth/sessions', adapt(sessionsHandler));
app.delete('/api/auth/sessions', adapt(sessionsHandler));
app.post('/api/auth/register', adapt(registerHandler));
app.post('/api/auth/verify-email', adapt(verifyEmailHandler));
app.post('/api/auth/forgot-password', adapt(forgotPasswordHandler));
app.post('/api/auth/reset-password', adapt(resetPasswordHandler));
app.post('/api/auth/change-password', adapt(changePasswordHandler));
app.get('/api/compliance', adapt(complianceHandler));
app.get('/api/health', adapt(healthHandler));
app.get('/api/customer/profile', adapt(customerProfileHandler));
app.post('/api/customer/profile', adapt(customerProfileHandler));
app.put('/api/customer/profile', adapt(customerProfileHandler));
app.get('/api/contractor/profile', adapt(contractorProfileHandler));
app.post('/api/contractor/profile', adapt(contractorProfileHandler));
app.put('/api/contractor/profile', adapt(contractorProfileHandler));

app.get('/api/profile', adapt(profileHandler));
app.post('/api/profile', adapt(profileHandler));
app.put('/api/profile', adapt(profileHandler));
app.post('/api/profile/upload', adapt(uploadHandler));
app.get('/api/profile/completion', adapt(completionHandler));
app.get('/api/search', adapt(searchIndexHandler));
app.get('/api/search/providers', adapt(searchProvidersHandler));
app.get('/api/search/featured', adapt(searchFeaturedHandler));
app.get('/api/search/recommended', adapt(searchRecommendedHandler));
app.get('/api/search/recommendations', adapt(searchRecommendationsHandler));
app.get('/api/search/suggestions', adapt(searchSuggestionsHandler));
app.get('/api/providers', adapt(providersIndexHandler));
app.get('/api/providers/profile', adapt(providersProfileHandler));
app.post('/api/providers/profile', adapt(providersProfileHandler));
app.put('/api/providers/profile', adapt(providersProfileHandler));
app.get('/api/providers/:id', adapt(providersDetailHandler));
app.patch('/api/providers/:id/verify', adapt(providersVerifyHandler));
app.patch('/api/providers/:id/feature', adapt(providersFeatureHandler));
app.patch('/api/providers/:id/status', adapt(providersStatusHandler));
app.post('/api/requirements', adapt(requirementsIndexHandler));
app.get('/api/requirements', adapt(requirementsIndexHandler));
app.get('/api/requirements/my', adapt(requirementsMyHandler));
app.get('/api/requirements/:id', adapt(requirementsDetailHandler));
app.put('/api/requirements/:id', adapt(requirementsDetailHandler));
app.delete('/api/requirements/:id', adapt(requirementsDetailHandler));
app.put('/api/requirements/:id/status', adapt(requirementsStatusHandler));
app.get('/api/requirements/:id/notes', adapt(requirementsNotesHandler));
app.post('/api/requirements/:id/notes', adapt(requirementsNotesHandler));
app.post('/api/requirements/:id/attachments', adapt(requirementsAttachmentsHandler));

// Quotation Routes
app.post('/api/quotations', adapt(quotationsIndexHandler));
app.get('/api/quotations', adapt(quotationsIndexHandler));
app.get('/api/quotations/compare', adapt(quotationsCompareHandler));
app.get('/api/quotations/:id', adapt(quotationsDetailHandler));
app.put('/api/quotations/:id', adapt(quotationsDetailHandler));
app.delete('/api/quotations/:id', adapt(quotationsDetailHandler));
app.put('/api/quotations/:id/status', adapt(quotationsStatusHandler));
app.post('/api/quotations/:id/negotiate', adapt(quotationsNegotiateHandler));
app.post('/api/quotations/:id/revise', adapt(quotationsReviseHandler));

// Project Execution Routes
app.get('/api/projects', adapt(projectsIndexHandler));
app.get('/api/projects/:id', adapt(projectsDetailHandler));
app.put('/api/projects/:id', adapt(projectsDetailHandler));
app.get('/api/projects/:id/work-orders', adapt(projectsWorkOrdersHandler));
app.post('/api/projects/:id/work-orders', adapt(projectsWorkOrdersHandler));
app.get('/api/projects/:id/milestones', adapt(projectsMilestonesHandler));
app.post('/api/projects/:id/milestones', adapt(projectsMilestonesHandler));
app.get('/api/projects/:id/resources', adapt(projectsResourcesHandler));
app.post('/api/projects/:id/resources', adapt(projectsResourcesHandler));
app.get('/api/projects/:id/progress', adapt(projectsProgressHandler));
app.post('/api/projects/:id/progress', adapt(projectsProgressHandler));
app.post('/api/projects/:id/approvals', adapt(projectsApprovalsHandler));

// Scheduling Routes
app.post('/api/appointments', adapt(appointmentsIndexHandler));
app.get('/api/appointments', adapt(appointmentsIndexHandler));
app.get('/api/appointments/availability', adapt(appointmentsAvailabilityHandler));
app.put('/api/appointments/availability', adapt(appointmentsAvailabilityHandler));
app.get('/api/appointments/:id', adapt(appointmentsDetailHandler));
app.put('/api/appointments/:id/status', adapt(appointmentsStatusHandler));

// Booking Routes
app.post('/api/bookings', adapt(bookingsIndexHandler));
app.get('/api/bookings/my', adapt(bookingsMyHandler));
app.get('/api/bookings/:id', adapt(bookingsDetailHandler));
app.patch('/api/bookings/:id/cancel', adapt(bookingsCancelHandler));

// Collaboration & Chat Routes
app.get('/api/conversations', adapt(conversationsIndexHandler));
app.post('/api/conversations', adapt(conversationsIndexHandler));
app.get('/api/conversations/presence', adapt(conversationsPresenceHandler));
app.put('/api/conversations/presence', adapt(conversationsPresenceHandler));
app.get('/api/conversations/:id', adapt(conversationsDetailHandler));
app.delete('/api/conversations/:id', adapt(conversationsDetailHandler));
app.get('/api/conversations/:id/messages', adapt(conversationsMessagesHandler));
app.post('/api/conversations/:id/messages', adapt(conversationsMessagesHandler));
app.post('/api/conversations/:id/read', adapt(conversationsReadHandler));
app.get('/api/activities', adapt(activitiesIndexHandler));
app.get('/api/announcements', adapt(announcementsIndexHandler));
app.post('/api/announcements', adapt(announcementsIndexHandler));

// Workforce Classification Routes
app.get('/api/workforce/types', adapt(workforceTypesHandler));
app.post('/api/workforce/types', adapt(workforceTypesHandler));
app.put('/api/workforce/types', adapt(workforceTypesHandler));
app.get('/api/workforce/categories', adapt(workforceCategoriesHandler));

app.get('/api/provider/bookings', adapt(providerBookingsIndexHandler));
app.patch('/api/provider/bookings/:id/accept', adapt(providerBookingsAcceptHandler));
app.patch('/api/provider/bookings/:id/reject', adapt(providerBookingsRejectHandler));
app.patch('/api/provider/bookings/:id/start', adapt(providerBookingsStartHandler));
app.patch('/api/provider/bookings/:id/complete', adapt(providerBookingsCompleteHandler));

app.get('/api/admin/bookings', adapt(adminBookingsIndexHandler));
app.patch('/api/admin/bookings/:id', adapt(adminBookingsUpdateHandler));

app.get('/api/admin/users', adapt(adminUsersIndexHandler));
app.patch('/api/admin/users/:id', adapt(adminUsersDetailHandler));
app.delete('/api/admin/users/:id', adapt(adminUsersDetailHandler));

app.get('/api/admin/providers', adapt(adminProvidersIndexHandler));

app.get('/api/admin/subscriptions', adapt(adminSubscriptionsIndexHandler));

// Subscription Routes
app.get('/api/subscriptions/plans', adapt(subscriptionsPlansHandler));
app.get('/api/subscriptions/my', adapt(subscriptionsMyHandler));
app.post('/api/subscriptions/activate', adapt(subscriptionsActivateHandler));
app.post('/api/subscriptions/cancel', adapt(subscriptionsCancelHandler));
app.post('/api/subscriptions/create-order', adapt(subscriptionsCreateOrderHandler));
app.post('/api/subscriptions/verify-payment', adapt(subscriptionsVerifyPaymentHandler));
app.post('/api/subscriptions/webhook', adapt(subscriptionsWebhookHandler));

app.post('/api/admin/subscriptions/plans', adapt(adminPlansIndexHandler));
app.put('/api/admin/subscriptions/plans/:id', adapt(adminPlansDetailHandler));
app.delete('/api/admin/subscriptions/plans/:id', adapt(adminPlansDetailHandler));

// Consultation Routes
app.post('/api/consultations', adapt(consultationsIndexHandler));
app.get('/api/consultations/my', adapt(consultationsIndexHandler));
app.get('/api/consultations/:id', adapt(consultationsDetailHandler));
app.patch('/api/consultations/:id/cancel', adapt(consultationsCancelHandler));

app.get('/api/provider/consultations', adapt(providerConsultationsIndexHandler));
app.patch('/api/provider/consultations/:id/accept', adapt(providerConsultationsAcceptHandler));
app.patch('/api/provider/consultations/:id/reject', adapt(providerConsultationsRejectHandler));
app.patch('/api/provider/consultations/:id/reschedule', adapt(providerConsultationsRescheduleHandler));
app.patch('/api/provider/consultations/:id/complete', adapt(providerConsultationsCompleteHandler));

app.get('/api/provider/availability', adapt(providerAvailabilityHandler));
app.put('/api/provider/availability', adapt(providerAvailabilityHandler));

app.get('/api/admin/consultations', adapt(adminConsultationsIndexHandler));
app.patch('/api/admin/consultations/:id', adapt(adminConsultationsDetailHandler));

// Callback Request Routes
app.post('/api/callbacks', adapt(publicCallbacksIndexHandler));
app.get('/api/callbacks/status', adapt(publicCallbacksStatusHandler));

app.get('/api/admin/callbacks', adapt(adminCallbacksIndexHandler));
app.get('/api/admin/callbacks/analytics', adapt(adminCallbacksAnalyticsHandler));
app.get('/api/admin/callbacks/:id', adapt(adminCallbacksDetailHandler));
app.patch('/api/admin/callbacks/:id/assign', adapt(adminCallbacksAssignHandler));
app.patch('/api/admin/callbacks/:id/status', adapt(adminCallbacksStatusHandler));
app.patch('/api/admin/callbacks/:id/notes', adapt(adminCallbacksNotesHandler));

app.get('/api/provider/callbacks', adapt(providerCallbacksIndexHandler));
app.patch('/api/provider/callbacks/:id/contacted', adapt(providerCallbacksContactedHandler));
app.patch('/api/provider/callbacks/:id/consultation-booked', adapt(providerCallbacksConsultationBookedHandler));
app.patch('/api/provider/callbacks/:id/service-booked', adapt(providerCallbacksServiceBookedHandler));

// Reviews Routes
app.get('/api/providers/:id/reviews', adapt(publicReviewsListHandler));
app.get('/api/providers/:id/rating-summary', adapt(publicRatingSummaryHandler));

app.post('/api/reviews', adapt(customerReviewsIndexHandler));
app.get('/api/reviews/my', adapt(customerReviewsMyHandler));
app.put('/api/reviews/:id', adapt(customerReviewsDetailHandler));
app.delete('/api/reviews/:id', adapt(customerReviewsDetailHandler));

app.post('/api/provider/reviews/:id/reply', adapt(providerReviewsReplyHandler));
app.get('/api/provider/reviews', adapt(providerReviewsIndexHandler));

app.get('/api/admin/reviews', adapt(adminReviewsIndexHandler));
app.patch('/api/admin/reviews/:id/hide', adapt(adminReviewsHideHandler));
app.patch('/api/admin/reviews/:id/restore', adapt(adminReviewsRestoreHandler));
app.delete('/api/admin/reviews/:id', adapt(adminReviewsDetailHandler));

// Articles Routes
app.get('/api/articles', adapt(publicArticlesIndexHandler));
app.get('/api/articles/featured', adapt(publicArticlesFeaturedHandler));
app.get('/api/articles/categories', adapt(publicArticlesCategoriesHandler));
app.get('/api/articles/:slug', adapt(publicArticlesDetailHandler));
app.get('/api/articles/category/:slug', adapt(publicArticlesCategoryHandler));
app.post('/api/articles/:id/track', adapt(publicArticlesTrackHandler));

app.get('/api/admin/articles', adapt(adminArticlesIndexHandler));
app.post('/api/admin/articles', adapt(adminArticlesIndexHandler));
app.put('/api/admin/articles/:id', adapt(adminArticlesDetailHandler));
app.delete('/api/admin/articles/:id', adapt(adminArticlesDetailHandler));
app.get('/api/admin/articles/analytics', adapt(adminArticlesAnalyticsHandler));

app.get('/api/admin/categories', adapt(adminArticlesCategoriesIndexHandler));
app.post('/api/admin/categories', adapt(adminArticlesCategoriesIndexHandler));
app.put('/api/admin/categories/:id', adapt(adminArticlesCategoriesDetailHandler));

// Analytics Routes
app.get('/api/admin/analytics/overview', adapt(adminAnalyticsOverviewHandler));
app.get('/api/admin/analytics/bookings', adapt(adminAnalyticsBookingsHandler));
app.get('/api/admin/analytics/providers', adapt(adminAnalyticsProvidersHandler));
app.get('/api/admin/analytics/customers', adapt(adminAnalyticsCustomersHandler));
app.get('/api/admin/analytics/subscriptions', adapt(adminAnalyticsSubscriptionsHandler));
app.get('/api/admin/analytics/consultations', adapt(adminAnalyticsConsultationsHandler));
app.get('/api/admin/analytics/callbacks', adapt(adminAnalyticsCallbacksHandler));
app.get('/api/admin/analytics/content', adapt(adminAnalyticsContentHandler));

// Provider Dashboard Routes
app.get('/api/provider/dashboard', adapt(providerDashboardIndexHandler));
app.get('/api/provider/performance', adapt(providerPerformanceHandler));
app.get('/api/provider/calendar', adapt(providerCalendarIndexHandler));
app.post('/api/provider/calendar/blocked-dates', adapt(providerCalendarBlockedDatesHandler));
app.post('/api/provider/calendar/availability', adapt(providerCalendarAvailabilityHandler));

// Chat Routes
app.get('/api/chat/conversations', adapt(chatConversationsIndexHandler));
app.post('/api/chat/conversations', adapt(chatConversationsIndexHandler));
app.get('/api/chat/conversations/:id', adapt(chatConversationsDetailHandler));
app.post('/api/chat/messages', adapt(chatMessagesIndexHandler));
app.get('/api/chat/messages/:conversationId', adapt(chatMessagesFetchHandler));
app.patch('/api/chat/messages/:id/read', adapt(chatMessagesReadHandler));

export default app;
