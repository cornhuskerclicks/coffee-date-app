"use client"

import QuizFunnelPage from "../page"

export default function QuizEmbedPage() {
  return (
    <div className="quiz-embed">
      <QuizFunnelPage />
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        .quiz-embed {
          min-height: 100vh;
        }
      `}</style>
    </div>
  )
}
