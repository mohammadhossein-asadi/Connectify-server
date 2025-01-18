import { body, validationResult } from "express-validator";

export const validatePost = [
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("userId").isMongoId().withMessage("Invalid user ID"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
