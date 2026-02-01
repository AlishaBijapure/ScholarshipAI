const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const authMiddleware = require('../middleware/auth.middleware');
const StudentProfile = require('../models/studentProfile.model');
const University = require('../models/university.model');
const UserUniversity = require('../models/userUniversity.model');
const Todo = require('../models/todo.model');
const User = require('../models/user.model');
const CounsellorProgress = require('../models/counsellorProgress.model');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Task 0: Recommend countries (Logic Unchanged)
async function ensureCountryRecommendation(userId) {
    try {
        const profile = await StudentProfile.findOne({ userId });
        let progress = await CounsellorProgress.findOne({ userId });
        if (!progress) progress = await CounsellorProgress.create({ userId, currentTask: 0 });

        const budget = profile?.budgetRange || '$30,000 - $50,000';
        const course = profile?.fieldOfStudy || profile?.major || 'General Studies';

        let availableCountries = await University.distinct('country');

        if (!availableCountries || availableCountries.length === 0) {
            console.log("Warning: No countries found in DB. Using defaults.");
            availableCountries = ['USA', 'United Kingdom', 'Canada', 'Australia', 'Germany'];
        }

        let strategyPrompt = "";
        if (budget.includes('< $10,000') || budget.includes('10,000')) {
            strategyPrompt = "STRATEGY: Select 1 country that is the absolute best for the course regardless of cost, and 4 countries that are good for the course BUT specifically known for being budget-friendly.";
        } else if (budget.includes('$10,000 - $30,000')) {
            strategyPrompt = "STRATEGY: Select 2 countries that are the absolute best for the course, and 3 countries that are good for the course and fit a moderate budget.";
        } else {
            strategyPrompt = "STRATEGY: Select the top 5 countries purely based on educational quality and reputation. Budget is not a constraint.";
        }

        const prompt = `
        You are an expert Overseas Education Counsellor.

        **USER PROFILE:**
        - Target Course: "${course}"
        - Intended Degree: "${profile?.intendedDegree || 'Masters'}"
        - Budget: "${budget}"
        - GPA: "${profile?.gpa || 'N/A'}"

        **AVAILABLE COUNTRIES IN DATABASE:** 
        ${JSON.stringify(availableCountries)}

        **YOUR TASK:**
        Select exactly 5 countries from the "AVAILABLE COUNTRIES IN DATABASE" list above that best fit the user.

        **SELECTION STRATEGY:**
        ${strategyPrompt}

        **OUTPUT FORMAT:**
        Return a strictly valid JSON array of 5 objects.
        IMPORTANT: Output ONLY the JSON. Do NOT use markdown code blocks. Do NOT add any text before or after the JSON.
            [
                {
                    "country": "Name",
                    "reason": "Specific reason why this fits their ${course} and budget/career goals. Be specific.",
                    "avgTuition": "Estimated annual tuition in USD (e.g. $15,000) or 'Free' if applicable" 
          }
            ]
        `;

        let aiResponseText = "";

        // Retry logic for 429 errors (up to 3 attempts with exponential backoff on primary model)
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const result = await ai.models.generateContent({
                    model: 'gemini-2.0-flash',
                    contents: prompt,
                    config: { responseMimeType: 'application/json' }
                });
                aiResponseText = result.text ?? result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
                if (aiResponseText) break; // Success
            } catch (err) {
                console.warn(`Gemini attempt ${attempt} failed:`, err.message);
                if (err.status === 429 || err.code === 429) {
                    const delay = Math.pow(2, attempt) * 1000;
                    // Wait before retry
                    await new Promise(r => setTimeout(r, delay));
                } else {
                    break; // Don't retry non-transient errors
                }
            }
        }

        let finalSelection = [];
        try {
            // Robust JSON extraction
            const jsonMatch = aiResponseText.match(/\[[\s\S]*\]/);
            const jsonStr = jsonMatch ? jsonMatch[0] : aiResponseText;
            finalSelection = JSON.parse(jsonStr);
        } catch (e) {
            console.error("JSON Parse failed. Raw AI Text:", aiResponseText);
        }

        if (!finalSelection || !Array.isArray(finalSelection) || finalSelection.length < 5) {
            console.log("AI returned insufficient/invalid data. Using fallback logic.");

            // Smart Fallback: Prioritize Tier 1 countries
            const TIER_1 = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "Ireland", "New Zealand", "Netherlands", "France", "Singapore"];
            const preferred = availableCountries.filter(c => TIER_1.some(t => c.includes(t) || t.includes(c)));
            const others = availableCountries.filter(c => !preferred.includes(c));

            const shuffledPreferred = preferred.sort(() => 0.5 - Math.random());
            const shuffledOthers = others.sort(() => 0.5 - Math.random());

            const combined = [...shuffledPreferred, ...shuffledOthers].slice(0, 5);

            finalSelection = combined.map(c => ({
                country: c,
                reason: `Popular destination for ${course}.`,
                avgTuition: "Varies"
            }));
        }

        const proposedCountries = [];
        for (const item of finalSelection) {
            const count = await University.countDocuments({ country: item.country });
            if (count > 0) {
                proposedCountries.push({
                    country: item.country,
                    reason: item.reason,
                    avgTuition: item.avgTuition,
                    universitiesCount: count
                });
            }
        }

        if (proposedCountries.length < 5) {
            const used = proposedCountries.map(c => c.country);
            const remaining = availableCountries.filter(c => !used.includes(c));
            for (let i = 0; i < (5 - proposedCountries.length); i++) {
                if (remaining[i]) {
                    const count = await University.countDocuments({ country: remaining[i] });
                    proposedCountries.push({
                        country: remaining[i],
                        reason: `Alternative option.`,
                        avgTuition: "Varies",
                        universitiesCount: count
                    });
                }
            }
        }

        progress.task0.proposedCountries = proposedCountries;
        await progress.save();
        return progress;

    } catch (error) {
        console.error("Critical Error in Country Logic:", error);
        return progress;
    }
}

// Task 1: Recommend universities (Always Replace Logic)
function getTask4Guidance(universityName, docType) {
    let guidance = '';
    const label = docType.toUpperCase();

    if (docType === 'sop') {
        guidance = `**Guidance for SOP at ${universityName}**:\n` +
            "- **Motivation**: Clearly state why you chose this field.\n" +
            "- **Academic Background**: Mention relevant coursework and your GPA achievements.\n" +
            "- **Relevant Projects**: Highlight 1-2 major projects that show your practical expertise.\n" +
            "- **Why this University**: Connect your research interests with the university's labs/professors.\n" +
            "- **Career Goals**: Define your short-term and long-term professional aspirations.";
    } else if (docType === 'lors') {
        guidance = `**Guidance for LORs for ${universityName}**:\n` +
            "- **Selection**: Choose recommenders who know your work closely (Professors or Managers).\n" +
            "- **Briefing**: Provide them with a summary of your achievements and projects to help them write.\n" +
            "- **Specific Examples**: Ask them to include specific instances where you showed leadership or technical skill.\n" +
            "- **Diversity**: Ideally, get recommendations that highlight different facets of your profile.";
    } else if (docType === 'resume') {
        guidance = `**Guidance for Resume for ${universityName}**:\n` +
            "- **Reverse Chronological**: List your latest education and experience first.\n" +
            "- **Quantify Achievements**: Use numbers (e.g., 'Improved performance by 20%').\n" +
            "- **Technical Skills**: Group your skills (Languages, Tools, Frameworks).\n" +
            "- **Projects & Internships**: Dedicate space to significant work outside of regular coursework.";
    }

    return guidance;
}

async function ensureUniversityRecommendation(userId) {
    try {
        const profile = await StudentProfile.findOne({ userId });
        let progress = await CounsellorProgress.findOne({ userId });
        if (!progress) progress = await CounsellorProgress.create({ userId, currentTask: 0 });

        // 1. Validation: Must have country selected
        if (!progress.task0?.finalized || !progress.task0?.selectedCountry) {
            return progress;
        }

        // 2. CHECK: Only skip if ALREADY FINALIZED.
        if (progress.task1?.finalized) return progress;

        const selectedCountry = progress.task0.selectedCountry;

        // 3. Fetch ALL universities in the country
        const allUnis = await University.find({ country: selectedCountry })
            .select('name city ranking acceptanceRate tuitionFee requirements fieldsOfStudy degreeLevels category')
            .lean();

        if (!allUnis || allUnis.length === 0) {
            console.log("No unis found in DB for selected country");
            return progress;
        }

        // If list already generated and not finalized, return it (don't regenerate every refresh unless empty)
        if (progress.task1?.proposedList?.length > 0) {
            return progress;
        }

        // 4. CREATE POOLS BASED ON DB FIELD 'category'
        const dreamPool = allUnis.filter(u => u.category === 'Dream');
        const targetPool = allUnis.filter(u => u.category === 'Target');
        const safePool = allUnis.filter(u => u.category === 'Safe');

        // 5. Construct AI Prompt
        const formatUniForAI = (u) => ({ id: u._id, name: u.name, courses: u.fieldsOfStudy || [] });

        const prompt = `
        You are an expert University Admissions Counsellor.
        
        ** USER PROFILE:**
            Major: ${profile?.fieldOfStudy || 'General'}
        Budget: ${profile?.budgetRange || 'N/A'}
        GPA: ${profile?.gpa || 'N/A'}
        
        ** TASK:**
            I have provided lists of universities categorized as Dream, Target, and Safe.
        You must select the most relevant ones for the user's Major/Profile from these specific lists.

            ** INSTRUCTIONS:**
                1. Select EXACTLY 2 universities from the "DREAM_POOL" list.
        2. Select EXACTLY 2 universities from the "TARGET_POOL" list.
        3. Select EXACTLY 1 university from the "SAFE_POOL" list.
        
        ** DREAM_POOL(Pick 2):**
            ${JSON.stringify(dreamPool.slice(0, 20).map(formatUniForAI))} 
        ${dreamPool.length === 0 ? "(None available - Select from Target instead)" : ""}

        ** TARGET_POOL(Pick 2):**
            ${JSON.stringify(targetPool.slice(0, 20).map(formatUniForAI))}
        ${targetPool.length === 0 ? "(None available - Select from Safe instead)" : ""}

        ** SAFE_POOL(Pick 1):**
            ${JSON.stringify(safePool.slice(0, 20).map(formatUniForAI))}
        ${safePool.length === 0 ? "(None available - Select from Target instead)" : ""}

        ** OUTPUT:**
            Return a strictly valid JSON array of exactly 5 objects.
                Format:
        [
            { "id": "db_id", "category": "Dream", "reason": "Why this fits..." },
            { "id": "db_id", "category": "Dream", "reason": "Why this fits..." },
            { "id": "db_id", "category": "Target", "reason": "Why this fits..." },
            { "id": "db_id", "category": "Target", "reason": "Why this fits..." },
            { "id": "db_id", "category": "Safe", "reason": "Why this fits..." }
        ]
            `;

        // 6. Generate AI Selection
        let aiResponse = [];
        try {
            const result = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            const text = result.text ?? result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            aiResponse = JSON.parse(cleanJson);
        } catch (e) {
            console.error("Gemini Selection Failed:", e);
        }

        // 7. Map Results back to DB Objects
        let proposedList = [];
        if (aiResponse && aiResponse.length > 0) {
            for (const item of aiResponse) {
                const dbUni = allUnis.find(u => u._id.toString() === item.id);
                if (dbUni) {
                    proposedList.push({
                        _id: dbUni._id,
                        name: dbUni.name,
                        country: dbUni.country,
                        city: dbUni.city,
                        category: dbUni.category,
                        ranking: dbUni.ranking,
                        fieldsOfStudy: dbUni.fieldsOfStudy,
                        degreeLevels: dbUni.degreeLevels,
                        requirements: dbUni.requirements,
                        tuitionFee: dbUni.tuitionFee,
                        acceptanceRate: dbUni.acceptanceRate,
                        reason: item.reason
                    });
                }
            }
        }

        // 8. FAILSAFE: If AI response is insufficient, fill from pools manually
        if (proposedList.length < 5) {
            const pickedIds = new Set(proposedList.map(p => p._id.toString()));

            const fillFromPool = (pool, count) => {
                let added = 0;
                for (const uni of pool) {
                    if (added >= count) break;
                    if (!pickedIds.has(uni._id.toString())) {
                        proposedList.push({ ...uni, reason: "Algorithm Match" });
                        pickedIds.add(uni._id.toString());
                        added++;
                    }
                }
            };

            const dreams = proposedList.filter(p => p.category === 'Dream').length;
            const targets = proposedList.filter(p => p.category === 'Target').length;
            const safes = proposedList.filter(p => p.category === 'Safe').length;

            if (dreams < 2) fillFromPool(dreamPool, 2 - dreams);
            if (targets < 2) fillFromPool(targetPool, 2 - targets);
            if (safes < 1) fillFromPool(safePool, 1 - safes);

            while (proposedList.length < 5 && allUnis.length > proposedList.length) {
                const leftover = allUnis.find(u => !pickedIds.has(u._id.toString()));
                if (leftover) {
                    proposedList.push({ ...leftover, reason: 'Fallback' });
                    pickedIds.add(leftover._id.toString());
                } else break;
            }
        }

        progress.task1.proposedList = proposedList.slice(0, 5);
        await progress.save();
        return progress;

    } catch (error) {
        console.error("Critical Error in University Logic:", error);
        return { task1: { proposedList: [] } };
    }
}

// Task 2: Determine exam requirements using AI (not DB)
async function ensureExamPlan(userId) {
    try {
        let progress = await CounsellorProgress.findOne({ userId });
        if (!progress || !progress.task1?.universityIds?.length) return progress;
        if (progress.task2?.requiredExamsPlan && Array.isArray(progress.task2.requiredExamsPlan) && progress.task2.requiredExamsPlan.length) {
            return progress;
        }

        const profile = await StudentProfile.findOne({ userId });
        const universities = await University.find({ _id: { $in: progress.task1.universityIds } })
            .select('name country fieldsOfStudy degreeLevels')
            .lean();

        if (!universities.length) return progress;

        const prompt = `
        You are an expert admissions counsellor.
        
        GOAL: Based on the 5 universities the user is targeting, identify ONLY the exams that are typically REQUIRED for admission for the user's intended degree/field.
        Do NOT list every possible exam. Avoid "kitchen sink" answers.

        USER PROFILE:
        Intended Degree: ${profile?.targetDegreeLevel || 'Masters'}
        Major/Field: ${profile?.fieldOfStudy || profile?.major || 'Undecided'}
        Current Education Level: ${profile?.currentEducationLevel || 'N/A'}

        TARGET UNIVERSITIES (the user is applying to these 5; provide exam requirements per item):
        ${universities.map(u => `- ${u.name} (${u.country}) | degree levels: ${(u.degreeLevels || []).join(', ') || 'N/A'} | fields: ${(u.fieldsOfStudy || []).join(', ') || 'General'}`).join('\n')}
        RULES:
        ⁠Focus on what is TYPICALLY REQUIRED for the user's intended degree + field.
        - English tests: list ONLY ONE primary option (IELTS OR TOEFL) unless the country/program typically requires a specific one.
        If both are generally accepted alternatives, pick the more common and mention the other in notes (do NOT include it as an extra required exam).
        - GRE/GMAT: include ONLY if it is commonly required for that degree/field/country (often it is NOT required). Do not include it "just in case".
        - Undergrad-only exams (SAT/ACT): include ONLY if the intended degree is Bachelor's. Otherwise exclude.
        - If an exam is optional / varies by program, do NOT mark it as required. Instead mention it in notes as "may be requested by some programs".
        - Give realistic, commonly expected minimum scores (avoid exact university-specific claims). Prefer typical ranges or a conservative typical minimum.
        - Output strictly valid JSON array, one entry per university, format:
        [
          {
            "universityName": "Name",
            "exams": [
              { "exam": "IELTS", "minScore": 6.5, "required": true, "notes": "English proficiency (typical). TOEFL is usually accepted as an alternative." }
            ]
          }
        ]
        `;

        let plan = [];
        try {
            const result = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            const text = result.text ?? result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
            plan = JSON.parse(clean);
        } catch (err) {
            console.error('Exam plan generation failed:', err);
        }

        if (!Array.isArray(plan) || !plan.length) {
            plan = universities.map(u => ({
                universityName: u.name,
                exams: [{ exam: 'IELTS', minScore: 6.5, required: true, notes: 'Typical English requirement (TOEFL usually accepted as alternative).' }]
            }));
        }

        // --- Country & degree–aware post-processing to keep exams realistic ---
        const intended = (profile?.intendedDegree || 'Masters').toLowerCase();
        const isBachelors = intended.includes('bachelor');
        const isMBA = intended.includes('mba');

        const uniCountryMap = new Map();
        universities.forEach(u => {
            if (u?.name) {
                uniCountryMap.set(u.name, u.country || '');
            }
        });

        plan = plan.map(entry => {
            const country = uniCountryMap.get(entry.universityName) || '';
            const exams = [];
            let englishAdded = false;

            (entry.exams || []).forEach(ex => {
                const examName = (ex.exam || '').toLowerCase();
                if (!examName) return;

                // English proficiency (IELTS/TOEFL) – always required, but only one primary exam
                if (examName === 'ielts' || examName === 'toefl') {
                    if (englishAdded) {
                        exams.push({
                            ...ex,
                            required: false,
                            notes: (ex.notes || '') + ' (alternative option, not required if you take the main English test).'
                        });
                    } else {
                        englishAdded = true;
                        exams.push({
                            ...ex,
                            required: true
                        });
                    }
                    return;
                }

                // SAT / ACT – only relevant for Bachelors
                if ((examName === 'sat' || examName === 'act') && !isBachelors) {
                    return;
                }

                // GRE / GMAT – usually for US/Canada (and often MBA / some STEM Masters). Rarely hard-required in Germany/Europe.
                if (examName === 'gre' || examName === 'gmat') {
                    const isUSOrCanada = /united states|usa|u\.s\.a|canada/i.test(country || '');
                    if (!isUSOrCanada && !isMBA) {
                        // Treat as optional advisory, not required
                        exams.push({
                            ...ex,
                            required: false,
                            notes: (ex.notes || '') + ' (sometimes requested, but not typically required for this country/degree).'
                        });
                        return;
                    }

                    exams.push({
                        ...ex,
                        required: true
                    });
                    return;
                }

                // All other exams – keep but mark as not required by default
                exams.push({
                    ...ex,
                    required: false
                });
            });

            // Ensure at least one English exam exists so user always sees a clear requirement
            if (!englishAdded) {
                exams.push({
                    exam: 'IELTS',
                    minScore: 6.5,
                    required: true,
                    notes: 'Typical English requirement; TOEFL is usually accepted as an alternative.'
                });
            }

            return {
                ...entry,
                exams
            };
        });

        // Build aggregated required exams
        const requiredMap = new Map();
        plan.forEach(entry => {
            (entry.exams || []).forEach(ex => {
                const key = (ex.exam || '').toLowerCase();
                if (!key) return;
                // If model returns optional items, ignore them for gating
                if (ex.required === false) return;
                const minScore = typeof ex.minScore === 'number' ? ex.minScore : parseFloat(ex.minScore);
                if (!requiredMap.has(key)) {
                    requiredMap.set(key, { exam: ex.exam, minScore: minScore || null });
                } else {
                    const existing = requiredMap.get(key);
                    if (minScore && (!existing.minScore || minScore > existing.minScore)) {
                        existing.minScore = minScore;
                    }
                }
            });
        });

        progress.task2.requiredExamsPlan = plan;
        progress.task2.requiredExams = Array.from(requiredMap.values());
        await progress.save();
        return progress;
    } catch (error) {
        console.error('Critical Error in Exam Plan Logic:', error);
        return null;
    }
}

// --- Helper Functions ---

async function getUserContext(userId) {
    const user = await User.findById(userId);
    const profile = await StudentProfile.findOne({ userId });
    const shortlisted = await UserUniversity.find({ userId, status: 'shortlisted' }).populate('universityId');
    const locked = await UserUniversity.find({ userId, status: 'locked' }).populate('universityId');
    const todos = await Todo.find({ userId, status: { $ne: 'completed' } });

    // OPTIMIZATION: Do NOT fetch all universities here. It's too heavy.
    return { user, profile, shortlisted: shortlisted.map(s => s.universityId), locked: locked.map(l => l.universityId), todos };
}

async function createTaskBasedPrompt(userMessage, context) {
    const { user, profile, progress, proposedList, universities, focusedUniversity } = context;
    const task = progress?.currentTask ?? 0;
    const countries = (profile?.preferredCountries?.length) ? profile.preferredCountries.join(', ') : 'Any';
    const major = profile?.fieldOfStudy || profile?.major || 'Undecided';
    const budget = profile?.budgetRange || 'Not specified';
    const exams = `IELTS: ${profile?.ieltsStatus || 'N/A'}${profile?.ieltsScore != null ? ' ' + profile.ieltsScore : ''} | TOEFL: ${profile?.toeflStatus || 'N/A'}${profile?.toeflScore != null ? ' ' + profile.toeflScore : ''} | GRE: ${profile?.greStatus || 'N/A'}${profile?.greScore != null ? ' ' + profile.greScore : ''} | GMAT: ${profile?.gmatStatus || 'N/A'}${profile?.gmatScore != null ? ' ' + profile.gmatScore : ''}`;

    const uniDb = universities.map(u => `- ${u.name} | ${u.country} | ${u.fieldsOfStudy?.join(', ')} | ${u.degreeLevels?.join(', ')} | requirements: ${JSON.stringify(u.requirements || {})}`).join('\n');

    let focusedUniStr = "";
    if (focusedUniversity) {
        focusedUniStr = `
        **CURRENTLY VIEWING UNIVERSITY:**
        Name: ${focusedUniversity.name}
        Location: ${focusedUniversity.city}, ${focusedUniversity.country}
        Global Rank: ${focusedUniversity.ranking || 'N/A'}
        Acceptance Rate: ${focusedUniversity.acceptanceRate || 'N/A'}%
        Tuition: ${JSON.stringify(focusedUniversity.tuitionFee || {})}
        Requirements: ${JSON.stringify(focusedUniversity.requirements || {})}
        
        **INSTRUCTION**: The user is currently looking at this specific university. 
        Focus your answers on ${focusedUniversity.name} unless asked otherwise.
        Reliably answer questions about its courses, campus life, reputation, etc., using your general knowledge + the data above.
        `;
    }

    let prompt = `You are a knowledgeable and helpful Study Abroad Assistant. 
    your primary goal is to help the user studey abroad, so answer ANY question the user has about universities, countries, or the process.
    
    You interpret "tasks" as a guide, not a strict cage.
    
    ${focusedUniStr}

USER: ${user.fullName}
PROFILE: Education ${profile?.currentEducationLevel || 'N/A'} | GPA ${profile?.gpa || 'N/A'} | Field ${major} | Budget ${budget} | Preferred Countries ${countries} | Intake ${profile?.targetIntakeYear || 'not set'} | ${exams}

FULL UNIVERSITY DATABASE (for checking user-suggested universities):
${uniDb}
`;

    if (task === 0) {
        const countriesList = progress?.task0?.proposedCountries || [];
        const selectedCountry = progress?.task0?.selectedCountry;

        let listStr = '';
        if (countriesList.length > 0) {
            listStr = countriesList.map((c, i) => {
                const isSelected = selectedCountry === c.country ? ' ✓ SELECTED' : '';
                return `${i + 1}. ${c.country}${isSelected} - ${c.reason} (${c.universitiesCount} universities, avg tuition: ${c.avgTuition})`;
            }).join('\n');
        } else {
            listStr = 'Generating recommendations based on your profile...';
        }

        prompt += `
        Current Status: **Task 0 (Country Selection)**.

        **USER PROFILE:**
        - Name: ${user.fullName}
        - Course: ${major} (${profile?.intendedDegree || 'Masters'})
        - Budget: ${budget}
        - GPA: ${profile?.gpa || 'N/A'}

        **RECOMMENDED COUNTRIES (Already presented to user):**
        ${JSON.stringify(countriesList)}

        **SYSTEM INSTRUCTIONS:**
        1. **SCOPE:**
           - You are helping the user select a **Country**.
           - Feel free to discuss countries, cities, and general study abroad topics.

        2. **YOUR BEHAVIOR:**
           - **Straightforward Recommendations**: The user has been shown 5 top destinations. Help them choose.
           - **Be Flexible & Helpful**: If the user asks about ANY other country (e.g., "What about Finland?"), **DISCUSS IT FREELY**. 
           - **Knowledgeable**: Use your own training data to answer detailed questions about culture, safety, and post-study work visas.

        3. **GOAL:**
           - Help the user feel confident in a country choice.
           - Call to Action: "Does one of these stand out to you?"

        **USER MESSAGE:**
        "${userMessage}"
        `;
    } else if (task === 1) {
        const list = proposedList || [];
        const listStr = list.length
            ? list.map((u, i) => `${i + 1}. ${u.name} — ${u.category} (${u.reason || 'Matched'})`).join('\n')
            : 'Generating specific university recommendations...';
        const selectedCountry = progress?.task0?.selectedCountry || 'N/A';

        prompt += `
        **CURRENT TASK: 1 — Finalize university list (5 colleges: 2 Dream, 2 Target, 1 Safe) from ${selectedCountry}**
        
        I have analyzed the available universities in ${selectedCountry} against your profile (GPA, Budget, Major) and selected these 5 specifically for you:
        ${listStr}
        
        **RULES — TASK 1 (University Selection)**
        1. **BE INFORMATIVE & HELPFUL**: You are a knowledgeable counsellor. The user is exploring options. While your main goal is to finalize the list of 5, you should generally answer *any* university-related question in detail.
        2. **THE 5 SELECTED**: Use the provided DB details to explain why these specific Dream/Target/Safe options fit the user's profile (GPA/Major).
        3. **OTHER UNIVERSITIES (General Knowledge)**:
           - If the user asks about a university NOT in the recommended 5, **answer enthusiastically** using your own broad knowledge.
           - Provide details like typical ranking, reputation for their major, and location pros/cons.
           - Do NOT simply say "I don't have data". Instead say: "That is a renowned university known for..."
        4. **COMPARISONS**: Freely compare the recommended universities with others the user mentions. Use tables or bullet points for clarity.
        5. **MODIFYING**: If the user seems to prefer a non-selected university, guide them: "If you prefer [University X], you can add it to your list using the dropdown above."
        6. **ARRIVING AT TASK**: If start of task, say: "Based on your profiled, I've curated this starting list of 5 universities (2 Dream, 2 Target, 1 Safe). What do you think of these choices?"
        7. **CTA**: Gently remind them: "Once you are happy with the list of 5, click **Finalize Unis** to proceed."
        `;
    } else if (task === 2) {
        const plan = progress?.task2?.requiredExamsPlan || [];
        const required = Array.isArray(progress?.task2?.requiredExams) ? progress.task2.requiredExams : [];
        const finalizedUnis = (progress?.task1?.proposedList || []).map(u => u?.name).filter(Boolean);
        const uniExamStr = plan.length
            ? plan.map(p => `- ${p.universityName}: ${(p.exams || []).map(e => `${e.exam}${e.minScore ? ' (min ' + e.minScore + ')' : ''}`).join(', ') || 'No exams listed'}`).join('\n')
            : '- Generating required exams per university based on typical norms...';
        const consolidatedStr = required.length
            ? required.map(r => `- ${r.exam}${r.minScore ? ` (typical min ${r.minScore})` : ''}`).join('\n')
            : '- Preparing your consolidated required exams list...';

        prompt += `
**CURRENT TASK: 2 — Required Exams**

Finalized universities (5):
${finalizedUnis.length ? finalizedUnis.map((n, i) => `${i + 1}. ${n}`).join('\n') : 'Loading your finalized list...'}

Based on the 5 universities you selected and your intended path (${profile?.intendedDegree || 'Masters'} in ${major}), here are the exams you typically need to take (with realistic minimums):
${consolidatedStr}

Per-university view (for transparency):
${uniExamStr}

After reviewing this, ask the user to enter their exam scores using the score input area below the chat (dropdown + score box).
        **RULES — TASK 2 (Exams)**
        1. **PRIMARY FOCUS**: Help the user plan their exams.
        2. **BE HELPFUL**: If the user asks about something else (e.g. "Do I need these exams for my visa?"), answer it! Don't refuse. Connect it back to the exams when possible.
        3. **OWN BRAIN**: Use the list below as a guide, but rely on your own AI knowledge for exam details, strategies, and scoring norms.
        4. **BE DETAILED**: Provide deep insights on exam sections, prep tips, and what scores are competitive.
5. **SCORE COLLECTION**: Always remind the user to submit scores using the UI below. If a score is missing, tell them to enter it. If it's below the minimum, tell them the minimum and ask them to retake/enter an updated score.
6. **GATING**: Do NOT allow moving to the next task until ALL required exams have acceptable scores recorded.
7. **ARRIVING AT TASK**: If the user just arrived at this step, say: "Based on the universities you've shortlisted, here are the requirements:\n\n[List Universities and their Exams]\n\nOverall, you need to provide scores for: **[Consolidated Exams]**. Please enter your actual or target scores below to build your roadmap." (Use the provided per-university and consolidated lists to fill in the message).
8. **ALWAYS END WITH CTA**: If requirements are incomplete: "Please provide the missing exam scores below to continue." If complete: "All required exams are recorded—moving to documents next."
`;
    } else if (task === 3) {
        const uniList = Array.isArray(progress?.task1?.proposedList) ? progress.task1.proposedList : [];
        const degree = profile?.intendedDegree || 'Masters';
        const field = major;

        const docsPerUni = uniList.length
            ? uniList.map((u, i) => {
                return `${i + 1}. ${u.name} (${u.country}) — Typical documents for ${degree} in ${field}:
   - Passport (valid for the entire study period)
   - Academic transcripts and degree certificates (all relevant previous studies)
   - Official English test score report (as required in the Exams step)
   - CV / Resume
   - Statement of Purpose (program-specific)
   - 2–3 Letters of Recommendation
   - Application form (online portal printout, if any)
   - Financial proof (bank statements / funding letters, as per country visa norms)
   - Any university- or program-specific forms listed on the official website`;
            }).join('\n\n')
            : 'Loading your finalized universities to prepare a documents checklist...';
        prompt += `
**CURRENT TASK: 3 — Required documents**

For each of your 5 selected universities, you should now focus on arranging the core admission documents.

Here is a typical documents checklist per university (use this as a working list; always cross-check the official website for exact requirements):

${docsPerUni}

Once you have arranged these documents for all universities, you can click *All Docs Ready* in the UI to move ahead.

        *RULES — TASK 3 (DOCUMENTS)*
        1. **PRIMARY FOCUS**: Guide the user on gathering documents.
        2. **BE INFORMATIONAL**: Answer any related question (e.g., "Do I need a visa for this?", "How strictly are transcripts checked?"). Don't be robotic.
        3. **USE GENERAL KNOWLEDGE**: Explain what each document is, why it matters, and how to make it strong (e.g., for LORs or CVs).
        4. **FORMATTING**: Use bullet points to make the checklist easy to read.
5. **ARRIVING AT TASK**: If the user has just arrived at this step, say: "I am creating a To-Do List of documents you can now access from your dashboard's quick action button. Please check it to see what you need to prepare."
6. *CTA / GATING*: Frequently remind the user that clicking **All Docs Ready* will tell the system that documents are prepared and will move them to the next step (SOPs, LORs, Resume details).
7. *QUICK PROMPTS*: Treat short prompts like "What documents do I need?" or "How should I organize my documents?" as full questions and reply with clear, structured guidance.
`;
    } else if (task === 4) {
        const by = progress?.task4?.byUniversity || [];
        const allDone = !!progress?.task4?.completed && by.length > 0 && by.every(b => b.sop && b.lors && b.resume);

        if (allDone) {
            // Final phase: everything completed
            prompt += `
*FINAL PHASE — All Tasks Complete*

The user has completed:
•⁠  ⁠Country selection
•⁠  ⁠University finalization
•⁠  ⁠Exams planning and score entry
•⁠  ⁠Documents checklist
•⁠  ⁠SOP / LORs / Resume planning for each university

Your job now is:
•⁠  ⁠Congratulate them warmly for completing all guided tasks.
•⁠  ⁠Clearly say: "Now the only thing left is actually submitting your applications. You can go to *My Universities* to visit each university's page and submit your forms."
•⁠  ⁠Remind them that the "Next Phase" / "My Universities" button in the UI will take them to their university list.
•⁠  ⁠From this point onward, you may answer *any questions related to studying abroad* (applications, timelines, visas, housing, course choices, career impact, etc.), but you should *not* introduce new structured tasks or stages.
•⁠  ⁠Keep answers practical, reassuring, and focused on helping them successfully submit and follow through on applications.
`;
        } else {
            const idx = Math.min(progress?.task4?.currentUniIndex ?? 0, Math.max(0, by.length - 1));
            const dtype = progress?.task4?.currentDocType || 'sop';
            const current = by[idx];
            const docLabel = dtype === 'sop' ? 'SOP' : dtype === 'lors' ? 'LORs' : 'Resume';
            const progStr = by.length
                ? by.map((b, i) => `${i + 1}. ${b.universityName}: SOP ${b.sop ? '✓' : '-'} LORs ${b.lors ? '✓' : '-'} Resume ${b.resume ? '✓' : '-'}`).join(' | ')
                : 'Starting...';

            prompt += `
**CURRENT TASK: 4 — SOP, LORs, Resume**
Progress: ${progStr}
**Current:** University ${idx + 1}: ${current?.universityName || 'N/A'} — **${docLabel}**

        **RULES — TASK 4 (SOP, LORs, Resume)**
        1. **HELPFUL GUIDE**: You are helping the user write their essays and potential application materials.
        2. **DETAILED ADVICE**:
           - **SOP**: Discuss story arcs, hooks, specific university details to mention, and structure.
           - **LORs**: Advise on how to brief recommenders and what qualities to highlight.
           - **Resume**: Focus on impact, quantification, and relevance to the degree.
        3. **FLEXIBILITY**: If the user asks general questions about the application process here, answer them freely.
4. After the user confirms they’re done for this item, say: "Click *Move to next* to continue."
5. When all universities show SOP, LORs, and Resume as ✓, congratulate them and let them know the next click will move them into the final phase.
`;
        }
    }

    prompt += `\nUSER MESSAGE: ${userMessage}`;
    return prompt;
}

// --- Routes ---

// GET /api/counsellor/stats
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        if (!user?.onboardingCompleted) return res.status(403).json({ message: 'Complete onboarding first.' });
        const shortlisted = await UserUniversity.countDocuments({ userId, status: 'shortlisted' });
        const locked = await UserUniversity.countDocuments({ userId, status: 'locked' });
        res.json({ shortlistedCount: shortlisted, lockedCount: locked });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// GET /api/counsellor/progress
router.get('/progress', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        if (!user?.onboardingCompleted) return res.status(403).json({ message: 'Complete onboarding first.' });
        let progress = await CounsellorProgress.findOne({ userId });
        if (!progress) progress = await CounsellorProgress.create({ userId, currentTask: 0 });
        res.json(progress);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// POST /api/counsellor/progress/action
router.post('/progress/action', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { action, country, intakeYear, examType, score, universityId } = req.body; // Added universityId
        const user = await User.findById(userId);
        if (!user?.onboardingCompleted) return res.status(403).json({ message: 'Complete onboarding first.' });

        let progress = await CounsellorProgress.findOne({ userId });
        if (!progress) progress = await CounsellorProgress.create({ userId, currentTask: 0 });
        const profile = await StudentProfile.findOne({ userId });

        if (action === 'reset_docs') {
            if (progress.currentTask !== 4) {
                return res.status(400).json({ message: 'You can only go back to documents from Task 4.' });
            }
            progress.task4 = { completed: false, byUniversity: [], currentUniIndex: 0, currentDocType: 'sop' };
            progress.task3.completed = false;
            progress.currentTask = 3;
            await progress.save();
            return res.json({ progress, message: 'Task 4 data cleared. Back to Task 3: Documents.' });
        }

        // TASK 0: Country Selection
        if (action === 'select_country') {
            if (progress.currentTask !== 0) return res.status(400).json({ message: 'Not on Task 0.' });
            if (!country) return res.status(400).json({ message: 'Country is required.' });

            const countryExists = await University.findOne({ country: country });
            if (!countryExists) {
                return res.status(400).json({ message: `Country "${country}" not found in our database.` });
            }

            const proposedCountries = progress.task0?.proposedCountries || [];
            const isInProposedList = proposedCountries.some(c => c.country === country);
            if (!isInProposedList) {
                const countryUnis = await University.find({ country: country });
                const tuitions = countryUnis.map(u => u.tuitionFee?.max || u.tuitionFee?.min || 0).filter(t => t > 0);
                const avgTuition = tuitions.length > 0 ? tuitions.reduce((a, b) => a + b, 0) / tuitions.length : 0;

                proposedCountries.push({
                    country: country,
                    reason: `You selected this country. It has ${countryUnis.length} universities available.`,
                    avgTuition: avgTuition > 0 ? `$${Math.round(avgTuition).toLocaleString()}` : 'Varies',
                    universitiesCount: countryUnis.length
                });
                progress.task0.proposedCountries = proposedCountries;
            }

            progress.task0.selectedCountry = country;
            await progress.save();
            return res.json({ progress, message: `Country ${country} selected. Click "Finalize Country" to confirm.` });
        }

        if (action === 'finalize_country') {
            if (progress.currentTask !== 0) return res.status(400).json({ message: 'Not on Task 0.' });
            if (!progress.task0?.selectedCountry) return res.status(400).json({ message: 'Select a country first.' });

            progress.task0.finalized = true;
            await progress.save();
            return res.json({ progress, message: `Country finalized! Excellent. Now let's find the best universities for you. Click "Move to Next Step" to continue.` });
        }

        if (action === 'move_to_next_step') {
            if (progress.currentTask === 0 && progress.task0?.finalized) {
                progress.currentTask = 1;
                await progress.save();
                // Trigger Gemini to generate universities immediately
                await ensureUniversityRecommendation(userId);
                progress = await CounsellorProgress.findOne({ userId });
                return res.json({ progress, message: "Excellent choice! Based on your academic profile and preferences, I've curated a list of top universities in that country for you. You can select up to 5 universities to build your final shortlist." });
            } else if (progress.currentTask === 1 && progress.task1?.finalized) {
                progress.currentTask = 2;
                await progress.save();
                await ensureExamPlan(userId);
                progress = await CounsellorProgress.findOne({ userId });

                const uniExamsList = (progress.task2?.requiredExamsPlan || []).map((u, i) =>
                    `${i + 1}. **${u.universityName}**: ${u.exams.filter(e => e.required !== false).map(e => e.exam).join(', ') || 'None'}`
                ).join('\n');
                const consolidatedExams = (progress.task2?.requiredExams || []).map(r => r.exam).join(', ') || 'required exams';

                const msg = `Based on the universities you've shortlisted, here are the requirements:\n\n${uniExamsList}\n\nOverall, you need to provide scores for these exams: **${consolidatedExams}**. Please enter your actual or target scores below to build your roadmap.`;
                return res.json({ progress, message: msg });
            } else if (progress.currentTask === 2 && progress.task2?.completed) {
                progress.currentTask = 3;
                await progress.save();
                const docList = "- Passport (valid)\n- Academic Transcripts & Certificates\n- English Test Score Report\n- CV / Resume\n- Statement of Purpose (SOP)\n- 2-3 Letters of Recommendation (LORs)\n- Financial Proof (Bank Statements)";
                const msg = `Based on the universities you've shortlisted, here are the essential documents you'll need to prepare:\n\n${docList}\n\nPlease start collecting these. Once you have everything ready, click **All Docs Ready** Below to move to the final step (SOP, LORs, and Resume guidance).`;
                return res.json({ progress, message: msg });
            } else if (progress.currentTask === 3 && progress.task3?.completed) {
                progress.currentTask = 4;
                if (!progress.task4.byUniversity?.length && progress.task1.universityIds?.length) {
                    const unis = await University.find({ _id: { $in: progress.task1.universityIds } });
                    progress.task4.byUniversity = unis.map(u => ({
                        universityId: u._id,
                        universityName: u.name,
                        sop: false,
                        lors: false,
                        resume: false
                    }));
                    progress.task4.currentUniIndex = 0;
                    progress.task4.currentDocType = 'sop';
                }
                await progress.save();
                return res.json({ progress, message: "Excellent! We've reached the final phase: SOPs, LORs, and Resume guidance. We'll go through each university on your list one by one." });
            } else {
                return res.status(400).json({ message: 'Cannot move to next step. Complete current task first.' });
            }
        }

        if (action === 'reselect_country') {
            if (progress.currentTask === 0) {
                return res.status(400).json({ message: 'Already on Task 0.' });
            }
            progress.task0.finalized = false;
            progress.task0.selectedCountry = null;
            progress.task0.proposedCountries = [];

            if (progress.task1?.universityIds?.length) {
                await UserUniversity.deleteMany({ userId, universityId: { $in: progress.task1.universityIds } });
            }
            progress.task1 = { finalized: false, proposedList: [], universityIds: [] };
            progress.currentTask = 0;
            await progress.save();
            await ensureCountryRecommendation(userId);
            progress = await CounsellorProgress.findOne({ userId });
            return res.json({ progress, message: 'Resetting country selection.' });
        }

        // TASK 1: University Selection

        // ADD UNIVERSITY MANUALLY
        if (action === 'add_university') {
            if (progress.currentTask !== 1) return res.status(400).json({ message: 'Not on Task 1.' });
            if (!universityId) return res.status(400).json({ message: 'University ID required.' });
            if ((progress.task1?.proposedList?.length || 0) >= 5) {
                return res.status(400).json({ message: 'Your list already has 5 universities. Remove one before adding another.' });
            }

            const uni = await University.findById(universityId);
            if (!uni) return res.status(404).json({ message: 'University not found.' });

            // Check if already in list
            const exists = progress.task1.proposedList.some(p => p._id.toString() === universityId);
            if (exists) return res.status(400).json({ message: 'University already in your list.' });

            progress.task1.proposedList.push({
                _id: uni._id,
                name: uni.name,
                country: uni.country,
                city: uni.city,
                category: uni.category,
                ranking: uni.ranking,
                fieldsOfStudy: uni.fieldsOfStudy,
                degreeLevels: uni.degreeLevels,
                requirements: uni.requirements,
                tuitionFee: uni.tuitionFee,
                acceptanceRate: uni.acceptanceRate,
                reason: 'Manually added by user.'
            });

            await progress.save();
            return res.json({ progress, message: `${uni.name} added to your list.` });
        }

        // REMOVE UNIVERSITY MANUALLY
        if (action === 'remove_university') {
            if (progress.currentTask !== 1) return res.status(400).json({ message: 'Not on Task 1.' });
            if (!universityId) return res.status(400).json({ message: 'University ID required.' });

            progress.task1.proposedList = progress.task1.proposedList.filter(p => p._id.toString() !== universityId);

            await progress.save();
            return res.json({ progress, message: 'University removed from list.' });
        }

        if (action === 'finalize_list') {
            const listLen = progress.task1?.proposedList?.length || 0;
            if (progress.currentTask !== 1 || listLen === 0) {
                return res.status(400).json({ message: 'No list to finalize.' });
            }
            if (listLen !== 5) {
                return res.status(400).json({ message: 'You must have exactly 5 universities in your list to finalize.' });
            }
            const ids = progress.task1.proposedList.map(p => p._id);
            progress.task1.universityIds = ids;
            progress.task1.finalized = true;
            progress.currentTask = 2;
            await progress.save();
            await ensureExamPlan(userId);
            progress = await CounsellorProgress.findOne({ userId });

            for (const id of ids) {
                const ex = await UserUniversity.findOne({ userId, universityId: id });
                if (!ex) {
                    const u = await University.findById(id);
                    // Find category from proposedList
                    const prop = progress.task1.proposedList.find(p => p._id.toString() === id.toString());
                    await UserUniversity.create({
                        userId,
                        universityId: id,
                        status: 'locked',
                        category: prop?.category || 'Target'
                    });
                }
            }
            const uniExamsList = (progress.task2?.requiredExamsPlan || []).map((u, i) =>
                `${i + 1}. **${u.universityName}**: ${u.exams.filter(e => e.required !== false).map(e => e.exam).join(', ') || 'None'}`
            ).join('\n');
            const consolidatedExams = (progress.task2?.requiredExams || []).map(r => r.exam).join(', ') || 'required exams';

            const msg = `List finalized! Based on your selected universities, here are the requirements:\n\n${uniExamsList}\n\nOverall, you need to provide scores for: **${consolidatedExams}**. Please enter your actual or target scores below to build your roadmap.`;
            return res.json({ progress, message: msg });
        }

        if (action === 'modify_list' || action === 'reselect_universities') {
            if (progress.currentTask !== 1 && progress.currentTask !== 2) {
                return res.status(400).json({ message: 'Can only modify from Task 1 or 2.' });
            }

            if (progress.task1?.universityIds?.length) {
                await UserUniversity.deleteMany({ userId, universityId: { $in: progress.task1.universityIds } });
            }

            if (progress.currentTask === 2) {
                progress.task2 = {
                    completed: false,
                    requiredExams: [],
                    completedExams: [],
                    requiredExamsPlan: [],
                    completedScores: {}
                };
            }

            progress.task1.finalized = false;
            progress.task1.universityIds = [];
            // We keep the proposed list in case they just want to edit, unless it was a full reselect
            if (action === 'reselect_universities') {
                progress.task1.proposedList = [];
                progress.currentTask = 1;
                await progress.save();
                await ensureUniversityRecommendation(userId); // Regenerate with AI
            } else {
                progress.currentTask = 1;
                await progress.save();
            }

            progress = await CounsellorProgress.findOne({ userId });
            return res.json({ progress, message: 'List unlocked. You can add or remove universities now.' });
        }

        if (action === 'set_intake') {
            const year = parseInt(intakeYear, 10);
            if (!year || year < 2025 || year > 2035) return res.status(400).json({ message: 'Invalid year.' });
            progress.task1.intakeYear = year;
            if (profile) { profile.targetIntakeYear = year; await profile.save(); }
            await progress.save();
            return res.json({ progress, message: `Intake set to ${year}.` });
        }

        // TASK 2: Exams
        if (action === 'exam_done') {
            return res.status(400).json({ message: 'Please submit your scores using "exam_score". Mark Done is disabled until all required scores are recorded.' });
        }

        if (action === 'exam_score') {
            const t = (examType || '').toLowerCase();
            const s = parseFloat(score);
            if (!profile) return res.status(400).json({ message: 'Profile not found.' });

            // Ensure plan exists
            await ensureExamPlan(userId);
            progress = await CounsellorProgress.findOne({ userId });
            const requiredList = progress.task2?.requiredExams || [];
            const plan = progress.task2?.requiredExamsPlan || [];
            if (!requiredList.length) {
                return res.status(400).json({ message: 'Required exams not prepared yet. Please try again.' });
            }

            const requiredMap = new Map();
            requiredList.forEach(r => requiredMap.set((r.exam || '').toLowerCase(), r));

            if (!requiredMap.has(t)) {
                return res.status(400).json({ message: `${examType} is not in the required exams list for your selected universities.` });
            }

            if (!progress.task2.completedScores) progress.task2.completedScores = {};
            progress.task2.completedScores[t] = s;
            progress.markModified('task2.completedScores');

            // Evaluate minimum score if present
            const req = requiredMap.get(t);
            if (req?.minScore && s < req.minScore) {
                await progress.save();
                return res.json({ progress, message: `Score recorded for ${examType}, but the typical minimum is ${req.minScore}. Please provide a higher score or retake the exam.` });
            }

            // Check if all required exams satisfied
            const missing = [];
            requiredList.forEach(r => {
                const key = (r.exam || '').toLowerCase();
                const val = progress.task2.completedScores?.[key];
                if (!val) {
                    missing.push(r.exam || key);
                    return;
                }
                if (r.minScore && val < r.minScore) {
                    missing.push(`${r.exam || key} (min ${r.minScore})`);
                }
            });

            if (missing.length === 0 && progress.currentTask === 2) {
                progress.task2.completed = true;
                progress.currentTask = 3;
                await progress.save();
                const msg = `Score recorded for ${examType}. All required exams are captured! I have created a To-Do List of documents that you can now access from the **To-Do List** button on your dashboard. Please check it to see what you need to prepare.`;
                return res.json({ progress, message: msg });
            }

            await progress.save();
            return res.json({ progress, message: `Score recorded for ${examType}. Still need: ${missing.join(', ')}.` });
        }

        // TASK 3: Documents
        if (action === 'all_docs_available') {
            if (progress.currentTask !== 3) return res.status(400).json({ message: 'Not on Task 3.' });
            progress.task3.completed = true;
            progress.currentTask = 4;
            if (!progress.task4.byUniversity?.length && progress.task1.universityIds?.length) {
                const unis = await University.find({ _id: { $in: progress.task1.universityIds } });
                progress.task4.byUniversity = unis.map(u => ({
                    universityId: u._id,
                    universityName: u.name,
                    sop: false,
                    lors: false,
                    resume: false
                }));
                progress.task4.currentUniIndex = 0;
                progress.task4.currentDocType = 'sop';
            }
            await progress.save();
            return res.json({ progress, message: 'Documents verified! Moving to the final phase: SOPs, LORs, and Resume guidance.' });
        }

        if (action === 'reset_exams') {
            if (progress.currentTask !== 3) {
                return res.status(400).json({ message: 'You can only go back to exams from Task 3.' });
            }
            // Clear Task 2 exam data and restart exam planning
            progress.task2 = {
                completed: false,
                requiredExams: [],
                completedExams: [],
                requiredExamsPlan: [],
                completedScores: {}
            };
            progress.currentTask = 2;
            await progress.save();
            await ensureExamPlan(userId);
            progress = await CounsellorProgress.findOne({ userId });
            return res.json({ progress, message: 'Exams reset. Please re-enter required exam scores.' });
        }

        // TASK 4: SOP/LORs/Resume
        if (action === 'move_to_next_doc') {
            if (progress.currentTask !== 4) return res.status(400).json({ message: 'Not on Task 4.' });
            const by = progress.task4.byUniversity || [];
            const idx = progress.task4.currentUniIndex;
            const dtype = progress.task4.currentDocType;
            if (idx >= by.length) return res.json({ progress });

            if (dtype === 'sop') {
                progress.task4.byUniversity[idx].sop = true;
                progress.task4.currentDocType = 'lors';
            } else if (dtype === 'lors') {
                progress.task4.byUniversity[idx].lors = true;
                progress.task4.currentDocType = 'resume';
            } else {
                progress.task4.byUniversity[idx].resume = true;
                progress.task4.currentUniIndex = idx + 1;
                progress.task4.currentDocType = 'sop';
            }
            progress.markModified('task4.byUniversity');

            const allDone = progress.task4.byUniversity.every(b => b.sop && b.lors && b.resume);
            if (allDone) progress.task4.completed = true;
            await progress.save();
            if (allDone) {
                return res.json({ progress, message: 'Congratulations! All your tasks are completed.' });
            } else {
                return res.json({ progress, message: 'Moved to next document.' });
            }
        }

        return res.status(400).json({ message: 'Unknown action.' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// GET /api/counsellor/recommend-countries
router.get('/recommend-countries', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        if (!user?.onboardingCompleted) return res.status(403).json({ message: 'Complete onboarding first.' });
        const progress = await ensureCountryRecommendation(userId);
        const proposed = progress.task0?.proposedCountries || [];
        res.json({ recommended: proposed, progress });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// GET /api/counsellor/recommend - 5 unis (2 Dream, 2 Target, 1 Safe), store in progress
router.get('/recommend', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        if (!user?.onboardingCompleted) return res.status(403).json({ message: 'Complete onboarding first.' });

        const progress = await ensureUniversityRecommendation(userId);
        const proposed = progress.task1?.proposedList || [];
        const selectedCountry = progress.task0?.selectedCountry;

        // Populate availableForDropdown: All unis in country MINUS already selected ones
        let availableForDropdown = [];
        if (selectedCountry) {
            const allInCountry = await University.find({ country: selectedCountry }).select('name category').lean();
            const proposedIds = new Set(proposed.map(p => p._id.toString()));
            availableForDropdown = allInCountry.filter(u => !proposedIds.has(u._id.toString()));
        }

        res.json({ recommended: proposed, availableForDropdown, progress });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.post('/chat', authMiddleware, async (req, res) => {
    try {
        const { message, universityId } = req.body;
        const userId = req.userId;

        const user = await User.findById(userId);
        if (!user || !user.onboardingCompleted) {
            return res.status(403).json({ message: 'Complete onboarding first.' });
        }

        let progress = await CounsellorProgress.findOne({ userId });
        if (!progress) progress = await CounsellorProgress.create({ userId, currentTask: 0 });

        if (progress.currentTask === 0) {
            progress = await ensureCountryRecommendation(userId);
        } else if (progress.currentTask === 1) {
            progress = await ensureUniversityRecommendation(userId);
        }

        const ctx = await getUserContext(userId);

        // --- OPTIMIZED CONTEXT LOADING ---
        let universitiesContext = [];
        let focusedUniversity = null;

        // NEW: Fetch specific university if user is viewing one
        if (universityId) {
            focusedUniversity = await University.findById(universityId).lean();
        }

        // Task 1, 2, 3, 4: Only fetch the relevant universities (Proposed or Finalized)
        // This ensures prompt is tiny and fast.
        if (progress.currentTask >= 1) {
            const list = progress.task1?.proposedList || [];
            const ids = list.map(u => u._id);
            if (ids.length) {
                universitiesContext = await University.find({ _id: { $in: ids } })
                    .select('name country city ranking category requirements fieldsOfStudy degreeLevels tuitionFee acceptanceRate')
                    .lean();
            }
        }

        const context = {
            ...ctx,
            progress,
            proposedList: progress?.task1?.proposedList || [],
            universities: universitiesContext,
            focusedUniversity // Pass to prompt creator
        };
        const prompt = await createTaskBasedPrompt(message, context);

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ message: 'Gemini API key not configured.' });
        }

        let aiResponse = '';
        const models = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-3-flash-preview'];
        for (const model of models) {
            try {
                const result = await ai.models.generateContent({ model, contents: prompt });
                aiResponse = result.text ?? result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
                if (typeof aiResponse !== 'string') aiResponse = String(aiResponse);
                if (aiResponse) break;
            } catch (err) {
                if (model === models[models.length - 1]) console.error('Gemini API Error:', err);
            }
        }
        if (!aiResponse) aiResponse = "I couldn't generate a response. Please try again.";

        let reply = (typeof aiResponse === 'string' ? aiResponse : '').replace(/\n{3,}/g, '\n\n').trim();
        if (!reply) reply = "Let's stay on the current task.";
        res.json({ message: reply, progress });
    } catch (error) {
        res.status(500).json({
            message: 'AI Error: ' + (error.body ? JSON.stringify(error.body) : error.message)
        });
    }
});

router.get('/profile-analysis', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        if (!user?.onboardingCompleted) return res.status(403).json({ message: 'Complete onboarding first.' });
        const context = await getUserContext(userId);
        const prompt = `Analyze this student profile. Mention strengths, gaps, and suggested next steps. ${JSON.stringify(context.profile)}`;
        const result = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
        const analysis = result.text ?? result.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Unable to generate analysis.';
        res.json({ analysis });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/counsellor/document-tools
router.post('/document-tools', authMiddleware, async (req, res) => {
    try {
        const { action, type, universityName, content } = req.body;

        let prompt = "";

        if (action === 'template') {
            prompt = `
            You are an expert admissions consultant.
            Provide a concise, bulleted structure (template) for a ${type} (SOP/LOR/Resume) specifically for ${universityName}.
            
            Format:
            - **Section Name**: Brief instruction on what to write (1 sentence).
            
            Make it short and actionable. Return ONLY the template points.
            `;
        } else if (action === 'grammar-check') {
            prompt = `
            You are an expert editor. 
            Review the following text for grammar, spelling, and clarity mistakes.
            Return ONLY the corrected version of the text. Do not add any introductory or concluding remarks.
            
            TEXT TO CORRECT:
            ${content}
            `;
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }

        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });

        const responseText = result.text ?? result.candidates?.[0]?.content?.parts?.[0]?.text ?? "I'm sorry, I couldn't process that.";

        res.json({ result: responseText });

    } catch (error) {
        console.error('Error in document tools:', error);
        res.status(500).json({ message: 'AI tool unavailable.' });
    }
});

module.exports = router;