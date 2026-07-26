import { Card, CardHeader, CardTitle, CardContent } from "@components/ui/Card";

const FAQS = [
  {
    question: "How do I find a past decision?",
    answer:
      "Use Decision History to browse and filter past decisions by department, status, date, or keyword. You can also ask a direct question on the Query page.",
  },
  {
    question: "What does the confidence score mean?",
    answer:
      "The confidence score reflects how strongly the AI's answer is supported by matching policy records. High confidence means the answer closely matches one or more specific policies; low confidence means few or no strong matches were found, and the answer should be independently verified.",
  },
  {
    question: "Can I only see my own department's data?",
    answer:
      "If you're a Department Head, you'll see data scoped to your department only. Administrators can view and compare data across all departments.",
  },
  {
    question: "What file types can I upload?",
    answer: "Currently, only PDF documents up to 25MB are supported for decision context.",
  },
];

export default function HelpCenterPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Help Center</h1>
        <p className="text-muted-foreground">
          Guidance on using the Decision Support System, plus accessibility information.
        </p>
      </div>

      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="mb-3 text-lg font-semibold">
          Frequently Asked Questions
        </h2>
        <div className="flex flex-col gap-3">
          {FAQS.map((faq) => (
            <Card key={faq.question}>
              <CardHeader>
                <CardTitle className="text-base">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">{faq.answer}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="accessibility-heading">
        <h2 id="accessibility-heading" className="mb-3 text-lg font-semibold">
          Accessibility Statement
        </h2>
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6 text-sm text-muted-foreground">
            <p>
              This system is designed to meet WCAG 2.1 Level AA guidelines. We are committed to
              providing an experience that is accessible to all users, including those using
              assistive technologies.
            </p>
            <p>Accessibility features in this system include:</p>
            <ul className="list-inside list-disc">
              <li>Full keyboard navigation across all pages and interactive elements</li>
              <li>Screen reader support, including descriptive labels for charts, graphs, and controls</li>
              <li>A logical, consistent heading hierarchy on every page</li>
              <li>Color contrast that meets AA standards throughout the interface</li>
              <li>Respect for your operating system's reduced-motion preference</li>
              <li>Visible focus indicators on every interactive element</li>
            </ul>
            <p>
              If you encounter an accessibility barrier while using this system, please contact
              your system administrator so it can be addressed.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
