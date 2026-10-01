"use client";

import { set, unset, type NumberInputProps } from "sanity";

export function CoinField(props: NumberInputProps) {
  const value = typeof props.value === "number" ? props.value : "";
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>
        {props.schemaType.title || "Game coins"} · fictional game coins
      </span>
      <input
        type="number"
        step={1}
        inputMode="numeric"
        value={value}
        readOnly={props.readOnly}
        onChange={(event) => {
          const raw = event.currentTarget.value;
          if (raw === "") {
            props.onChange(unset());
            return;
          }
          const next = Number(raw);
          if (!Number.isInteger(next)) return;
          props.onChange(set(next));
        }}
        style={{ width: "100%", padding: "10px 12px", fontSize: 16, borderRadius: 8, border: "1px solid #c7c4d4" }}
      />
      <span style={{ display: "block", marginTop: 6, color: "#4d4462" }}>
        {value === "" ? "Enter a whole number. Negatives are spends." : `${value} fictional game coins`}
      </span>
    </label>
  );
}
