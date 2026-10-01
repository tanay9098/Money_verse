"use client";

type PreviewChoice = { label?: string };
type PreviewStep = { title?: string; choices?: PreviewChoice[] };
type PreviewPrice = { price?: number; customers?: number };
type PreviewQuestion = { prompt?: string };
type PreviewDocument = {
  title?: string;
  reviewStatus?: string;
  engine?: string;
  startingCoins?: number;
  steps?: PreviewStep[];
  supplies?: { name?: string; cost?: number; cups?: number }[];
  prices?: PreviewPrice[];
  quiz?: PreviewQuestion[];
};

export function MissionPreview(props: { document: { displayed?: PreviewDocument | null } }) {
  const doc = props.document.displayed;
  if (!doc) {
    return <p style={{ padding: 16 }}>Save the mission to preview its play path.</p>;
  }

  return (
    <div style={{ padding: 20, fontFamily: "Nunito, sans-serif", color: "#241c33" }}>
      <p style={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4 }}>Play preview</p>
      <h2 style={{ marginTop: 8 }}>{doc.title || "Untitled mission"}</h2>
      <p>
        Status: {doc.reviewStatus || "draft"} · Style: {doc.engine || "choices"} · Starts with {doc.startingCoins ?? 0} game coins
      </p>
      <h3>Steps</h3>
      {doc.steps && doc.steps.length > 0 ? (
        <ol>
          {doc.steps.map((step, index) => (
            <li key={`${step.title ?? "step"}-${index}`}>
              <strong>{step.title || "Untitled step"}</strong>
              <ul>
                {(step.choices ?? []).map((choice, choiceIndex) => (
                  <li key={`${choice.label ?? "choice"}-${choiceIndex}`}>{choice.label || "Untitled choice"}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      ) : (
        <p>No choice steps. Lemonade missions use supplies and prices instead.</p>
      )}
      <h3>Supplies and prices</h3>
      <ul>
        {(doc.supplies ?? []).map((supply, index) => (
          <li key={`${supply.name ?? "supply"}-${index}`}>
            {supply.name}: {supply.cost} game coins for {supply.cups} cups
          </li>
        ))}
        {(doc.prices ?? []).map((price, index) => (
          <li key={`${price.price ?? "price"}-${index}`}>
            {price.price} game coins brings {price.customers} customers
          </li>
        ))}
      </ul>
      <h3>Knowledge check</h3>
      <ol>
        {(doc.quiz ?? []).map((question, index) => (
          <li key={`${question.prompt ?? "question"}-${index}`}>{question.prompt || "Untitled question"}</li>
        ))}
      </ol>
      <p>Players see this mission only after the status is approved and the document is published.</p>
    </div>
  );
}
