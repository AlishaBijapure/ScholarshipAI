const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const User = require('../models/user.model');
const StudentProfile = require('../models/studentProfile.model');
const UserUniversity = require('../models/userUniversity.model');
const Todo = require('../models/todo.model');
const CounsellorProgress = require('../models/counsellorProgress.model');

// GET /api/dashboard - Get dashboard data
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId);
        if (!user.onboardingCompleted) {
            return res.status(403).json({ message: 'Complete onboarding first.' });
        }
        const profile = await StudentProfile.findOne({ userId });
        const shortlisted = await UserUniversity.find({ userId, status: 'shortlisted' }).populate('universityId');
        const locked = await UserUniversity.find({ userId, status: 'locked' }).populate('universityId');
        const todos = await Todo.find({ userId }).sort({ priority: -1, createdAt: -1 });
        const counsellorProgress = await CounsellorProgress.findOne({ userId });

        // Calculate profile strength
        let profileStrength = {
            academics: 'Weak',
            exams: 'Not started',
            sop: 'Not started',
            overall: 'Weak'
        };

        if (profile) {
            // Academics strength
            const gpa = parseFloat(profile.gpa) || 0;
            if (gpa >= 3.7) profileStrength.academics = 'Strong';
            else if (gpa >= 3.0) profileStrength.academics = 'Average';
            else profileStrength.academics = 'Weak';

            // Exams status
            const examStatuses = [
                profile.ieltsStatus,
                profile.toeflStatus,
                profile.greStatus,
                profile.gmatStatus
            ];
            const completedExams = examStatuses.filter(s => s === 'Completed').length;
            const inProgressExams = examStatuses.filter(s => s === 'In progress').length;
            
            if (completedExams > 0) profileStrength.exams = 'Completed';
            else if (inProgressExams > 0) profileStrength.exams = 'In progress';
            else profileStrength.exams = 'Not started';

            // SOP status
            profileStrength.sop = profile.sopStatus;

            // Overall strength
            const strongCount = [
                profileStrength.academics === 'Strong',
                profileStrength.exams === 'Completed',
                profileStrength.sop === 'Ready'
            ].filter(Boolean).length;

            if (strongCount >= 2) profileStrength.overall = 'Strong';
            else if (strongCount >= 1) profileStrength.overall = 'Average';
            else profileStrength.overall = 'Weak';
        }

        // Get stage name (high-level funnel)
        const stageNames = {
            'profile_building': 'Building Profile',
            'discovering_universities': 'Discovering Universities',
            'finalizing_universities': 'Finalizing Universities',
            'preparing_applications': 'Preparing Applications'
        };

        // Build fine-grained journey stages mapped to counsellor progress model
        const stagesBase = [];

        // Stage 0: Building profile (onboarding + basic profile)
        const hasProfile = !!profile;
        stagesBase.push({
            key: 'building_profile',
            name: 'Building Profile',
            done: hasProfile
        });

        // Stage 1: Finalizing country (counsellor task0)
        const cp = counsellorProgress;
        const countryDone = !!(cp && cp.task0 && cp.task0.finalized);
        stagesBase.push({
            key: 'finalizing_country',
            name: 'Finalizing Country',
            done: countryDone
        });

        // Stage 2: Finalizing universities (counsellor task1)
        const unisDone = !!(cp && cp.task1 && cp.task1.finalized);
        stagesBase.push({
            key: 'finalizing_universities_detailed',
            name: 'Finalizing Universities',
            done: unisDone
        });

        // Stage 3: Taking exams (counsellor task2)
        const examsDone = !!(cp && cp.task2 && cp.task2.completed);
        stagesBase.push({
            key: 'taking_exams',
            name: 'Taking Exams',
            done: examsDone
        });

        // Stage 4: Preparing documents (counsellor task3)
        const docsDone = !!(cp && cp.task3 && cp.task3.completed);
        stagesBase.push({
            key: 'preparing_documents',
            name: 'Preparing Documents',
            done: docsDone
        });

        // Stage 5: Preparing LORs and SOPs (counsellor task4)
        const lorSopDone = !!(cp && cp.task4 && cp.task4.completed);
        stagesBase.push({
            key: 'preparing_lors_sops',
            name: 'Preparing LORs & SOPs',
            done: lorSopDone
        });

        // Turn into ordered stages with status: completed | active | pending
        let activeAssigned = false;
        const journeyStages = stagesBase.map((s) => {
            let status = 'pending';
            if (s.done) {
                status = 'completed';
            } else if (!activeAssigned) {
                status = 'active';
                activeAssigned = true;
            }
            return {
                key: s.key,
                name: s.name,
                status
            };
        });

        // Recent tasks: focus on current + upcoming stages, but still include last completed
        const incomplete = journeyStages.filter(s => s.status !== 'completed');
        const completed = journeyStages.filter(s => s.status === 'completed');
        const lastCompleted = completed.length ? [completed[completed.length - 1]] : [];
        const recentTasks = [...incomplete, ...lastCompleted].slice(0, 5);

        // Task stats derived from counsellor journey stages
        const totalJourneyTasks = journeyStages.length;
        const completedJourneyTasks = journeyStages.filter(s => s.status === 'completed').length;
        const pendingJourneyTasks = totalJourneyTasks - completedJourneyTasks;

        res.json({
            user: {
                fullName: user.fullName,
                email: user.email,
                onboardingCompleted: user.onboardingCompleted,
                currentStage: user.currentStage,
                stageName: stageNames[user.currentStage] || 'Unknown'
            },
            profile: profile ? {
                currentEducationLevel: profile.currentEducationLevel,
                intendedDegree: profile.intendedDegree,
                fieldOfStudy: profile.fieldOfStudy,
                targetIntakeYear: profile.targetIntakeYear,
                preferredCountries: profile.preferredCountries,
                budgetRange: profile.budgetRange
            } : null,
            profileStrength,
            stats: {
                shortlistedCount: shortlisted.length,
                lockedCount: locked.length,
                todosCount: totalJourneyTasks,
                completedTodosCount: completedJourneyTasks,
                pendingTodosCount: pendingJourneyTasks
            },
            shortlisted: shortlisted.map(s => ({
                id: s.universityId._id,
                name: s.universityId.name,
                country: s.universityId.country,
                category: s.category
            })),
            locked: locked.map(l => ({
                id: l.universityId._id,
                name: l.universityId.name,
                country: l.universityId.country,
                category: l.category
            })),
            recentTodos: todos.slice(0, 5),
            journeyStages,
            recentTasks
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Error fetching dashboard data.' });
    }
});

module.exports = router;
