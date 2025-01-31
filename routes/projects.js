const express = require('express');
const router = express.Router();
const noteController = require('../controllers/note');
const outcomeController = require('../controllers/outcome');
const reviewController = require('../controllers/review');
const {isAuthenticated,requireCompleteProfile} = require("../middlewares/isAuthenticated");



router.post('/:projectId/notes',isAuthenticated,
    noteController.createNote
);

router.get('/:projectId/notes',
  noteController.getNotes
);

router.get('/:projectId/notes/:noteId',
  noteController.getNoteDetail
);

router.put('/:projectId/notes/:noteId',isAuthenticated,
  noteController.updateNote
);

router.delete('/:projectId/notes/:noteId',isAuthenticated,
  noteController.deleteNote
);


router.post('/:projectId/outcomes',isAuthenticated,
  outcomeController.createOutcome
);

router.get('/:projectId/outcomes',
    outcomeController.getOutcomes
);

router.get('/:projectId/outcomes/:outcomeId',
    outcomeController.getOutcomeDetail
);

router.put('/:projectId/outcomes/:outcomeId',isAuthenticated,
  outcomeController.updateOutcome
);

router.delete('/:projectId/outcomes/:outcomeId',isAuthenticated,
  outcomeController.deleteOutcome
);

router.post('/:projectId/reviews',isAuthenticated,
    reviewController.createReview
  );
  
router.get('/:projectId/reviews',
    reviewController.getReviews
);
router.get('/:projectId/reviews/:reviewId',
    reviewController.getReviewDetail
);

router.put('/:projectId/reviews/:reviewId',isAuthenticated,
    reviewController.updateReview
);

router.delete('/:projectId/reviews/:reviewId',isAuthenticated,
    reviewController.deleteReview
);

module.exports = router;