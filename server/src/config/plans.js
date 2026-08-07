const PLAN_LIMITS = {
  STARTER: {
    maxStudentsPerRoom: 50,
    maxQuizzesPerMonth: 2, // Quizzes means Rooms
    hasCsvExport: false,
  },
  SEMESTER_PASS: {
    maxStudentsPerRoom: 150,
    maxQuizzesPerMonth: -1, // Unlimited
    hasCsvExport: true,
  },
  ANNUAL_PRO: {
    maxStudentsPerRoom: 150,
    maxQuizzesPerMonth: -1,
    hasCsvExport: true,
  },
  INSTITUTE: {
    maxStudentsPerRoom: 500,
    maxQuizzesPerMonth: -1,
    hasCsvExport: true,
  }
};

module.exports = PLAN_LIMITS;
