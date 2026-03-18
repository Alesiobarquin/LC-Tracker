# LC-Tracker 🚀

LC-Tracker is a comprehensive LeetCode tracking and study application designed to help users prepare for coding interviews through structured sprints, data-driven analytics, and an integrated AI-powered mock interview environment.

View Live: [lc-tracker-alpha.vercel.app](https://lc-tracker-alpha.vercel.app/)

## ✨ Key Features

- **📊 Advanced Analytics**: Track your progress with detailed charts, sprint history, and category-level mastery badges.
- **🎯 Structured Sprints**: Follow a guided study schedule with adaptive pacing and problem recommendations.
- **🤖 AI Mock Interviews**: Practice in an integrated coding environment (Python/JS) with real-time feedback and solution analysis powered by Google Gemini.
- **🏠 Intelligent Dashboard**: Stay focused with daily goals, problem timers, and quick access to your current sprint.
- **📚 Problem Library**: Browse and filter a curated list of LeetCode problems categorized by difficulty and topic.
- **⌨️ Syntax Reference**: Quick-access cards for common data structures and algorithms in Python and JavaScript.
- **🚀 Seamless Onboarding**: Get started quickly with a guided setup process for your study goals and skill levels.

## 🛠 Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Charts**: [Recharts](https://recharts.org/)
- **Code Editor**: [CodeMirror](https://codemirror.net/)
- **AI Integration**: [Google Gemini API](https://ai.google.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Ensure you have Node.js installed.
- **Gemini API Key**: You'll need an API key from [Google AI Studio](https://aistudio.google.com/) for mock interview features.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/alesiobarquin/LC-Tracker.git
   cd LC-Tracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

- `src/components`: React UI components (Dashboard, Analytics, MockInterview, etc.).
- `src/store`: Global state management with Zustand.
- `src/services`: External API integrations (LeetCode, Gemini).
- `src/data`: Curated problem lists and syntax references.
- `src/utils`: Helper functions and formatting utilities.

## 📄 License

This project is licensed under the Apache-2.0 License.
