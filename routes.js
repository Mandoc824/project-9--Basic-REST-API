const express = require("express");
const { asyncHandler } = require("./middleware/asyncHandler");
const { User, Course } = require("./models");
const { authenticateUser } = require("./middleware/auth-user");
const router = express.Router();

//User routes

//Get route that responds with the current authenticated user using the API
router.get(
  "/users",
  authenticateUser,
  asyncHandler(async (req, res) => {
    const user = req.currentUser;
    const userWithoutSensativeInfo = await User.findOne({
      where: {
        id: user.id,
      },
      attributes: {
        exclude: ["password", "createdAt", "updatedAt"],
      },
    });
    res.json({ User: userWithoutSensativeInfo });
  })
);

//Post route to create a new user.
router.post(
  "/users",
  asyncHandler(async (req, res) => {
    try {
      await User.create(req.body);
      res.setHeader("Location", "/").status(201).end();
    } catch (error) {
      if (
        error.name === "SequelizeValidationError" ||
        error.name === "SequelizeUniqueConstraintError"
      ) {
        const errors = error.errors.map((err) => err.message);
        res.status(400).json({ errors });
      } else {
        throw error;
      }
    }
  })
);

//Courses Routes

//Get all courses
router.get(
  "/courses",
  asyncHandler(async (req, res) => {
    const courses = await Course.findAll({
      include: {
        as: "User",
        model: User,
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    res.status(200).json({ courses });
  })
);

//Get course based on Id
router.get(
  "/courses/:id",
  asyncHandler(async (req, res) => {
    const course = await Course.findOne({
      where: {
        id: req.params.id,
      },
      include: {
        as: "User",
        model: User,
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    if (course) {
      res.status(200).json({ course });
    } else {
      const err = new Error("Sorry, a course matching that ID was not found");
      err.status = 404;
      throw err;
    }
  })
);

//Post route to creates a new course
router.post(
  "/courses",
  authenticateUser,
  asyncHandler(async (req, res) => {
    try {
      const newCourse = await Course.create(req.body);

      res.setHeader("Location", `/courses/${newCourse.id}`).status(201).end();
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        const errors = error.errors.map((err) => err.message);
        res.status(400).json({ errors });
      } else {
        throw error;
      }
    }
  })
);

//Put route that updates a course
router.put(
  "/courses/:id",
  authenticateUser,
  asyncHandler(async (req, res) => {
    const user = req.currentUser;
    const course = await Course.findByPk(req.params.id);
    if (course) {
      if (user.id !== course.userId) {
        res.status(403).end();
      } else {
        const errors = [];
        if (!req.body.title) errors.push("Please provide a title to update");
        if (!req.body.description)
          errors.push("Please provide a description to update");

        if (errors.length > 0) {
          res.status(400).json({ errors });
        } else {
          await course.update(req.body);
          res.status(204).end();
        }
      }
    } else {
      const err = new Error("A course matching that ID was not found");
      err.status = 404;
      throw err;
    }
  })
);

//Delete route that deletes a course
router.delete(
  "/courses/:id",
  authenticateUser,
  asyncHandler(async (req, res) => {
    const user = req.currentUser;
    const course = await Course.findByPk(req.params.id);
    if (course) {
      if (user.id !== course.userId) {
        res.status(403).end();
      } else {
        course.destroy();
        res.send(204).end();
      }
    } else {
      const err = new Error("A course matching that ID was not found");
      err.status = 404;
      throw err;
    }
  })
);
module.exports = router;
