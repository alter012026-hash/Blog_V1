function extractFAQs(content) {
  const faqs = [];

  const matches = content.match(/FAQ([\s\S]*?)(##|$)/i);

  if (!matches) return faqs;

  const block = matches[1];

  const questions = block.match(/\*\*(.*?)\?\*\*/g);

  if (questions) {
    questions.forEach((q) => {
      faqs.push({
        question: q.replace(/\*\*/g, ""),
        answer: "Resposta extraída do conteúdo principal.",
      });
    });
  }

  return faqs.slice(0, 4);
}

function generateFAQSchema(faqs) {
  if (!faqs.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((f) => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer,
      },
    })),
  };
}

module.exports = {
  extractFAQs,
  generateFAQSchema,
};