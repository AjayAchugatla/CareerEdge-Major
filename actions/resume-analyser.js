"use server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const getAnalysis = async (formData) => {
    const resumeFile = formData.get("resumeFile");
    if (!resumeFile) {
        throw new Error("No file uploaded");
    }
    const loader = new PDFLoader(resumeFile);
    const docs = await loader.load();
    const prompt = `
        You are an advanced AI Resume Analyzer Agent.
        Your task is to evaluate a candidate's resume and return a detailed analysis in the following structured JSON schema format.
        The schema must match the layout and structure of a visual UI that includes overall score, section scores, summary feedback, improvement tips, strengths, and weaknesses.

        📥 INPUT: I will provide a plain text resume.
        🎯 GOAL: Output a JSON report as per the schema below. The report should reflect:

        overall_score (0–100)

        overall_feedback (short message e.g., "Excellent", "Needs improvement")

        summary_comment (1–2 sentence evaluation summary)

        Section scores for:
        Contact Info
        Experience
        Education
        Skills

        Each section should include:
        - score (as percentage)
        - Optional comment about that section
        - Tips for improvement (3–5 tips)
                What’s Good (1–3 strengths)
        Needs Improvement (1–3 weaknesses)

        🧠 Output JSON Schema:
        {
        "overall_score": 85,
        "overall_feedback": "Excellent!",
        "summary_comment": "Your resume is strong, but there are areas to refine.",
        "sections": {
            "contact_info": {
            "score": 95,
            "comment": "Perfectly structured and complete."
            },
            "experience": {
            "score": 88,
            "comment": "Strong bullet points and impact."
            },
            "education": {
            "score": 70,
            "comment": "Consider adding relevant coursework."
            },
            "skills": {
            "score": 60,
            "comment": "Expand on specific skill proficiencies."
            }
        },
          "tips_for_improvement": [
            "Add more numbers and metrics to your experience section to show impact.",
            "Integrate more industry-specific keywords relevant to your target roles.",
            "Start bullet points with strong action verbs to make your achievements stand out."
        ],
        "whats_good": [
            "Clean and professional formatting.",
            "Clear and concise contact information.",
            "Relevant work experience."
        ],
        "needs_improvement": [
            "Skills section lacks detail.",
            "Some experience bullet points could be stronger.",
            "Missing a professional summary/objective."
        ]
        }
        Respond ONLY with the raw JSON. Do not include any explanation, heading, or additional commentary.
        Here is the resume content:
        """${docs[0].pageContent}"""
    `;
    try {
        const result = await model.generateContent(prompt);
        const content = result.response.text().trim();
        const jsonStart = content.indexOf("{");
        const jsonEnd = content.lastIndexOf("}");
        const rawJSON = content.slice(jsonStart, jsonEnd + 1);
        const analysis = JSON.parse(rawJSON);
        return analysis;
    } catch (error) {
        console.error("Error generating resume analysis:", error.message);
        throw new Error("Failed to generate resume analysis. Please try again later.");
    }
};

