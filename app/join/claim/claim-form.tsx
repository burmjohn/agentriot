"use client";

import * as React from "react";
import Link from "next/link";

import { PillButton } from "@/components/ui/pill-button";
import { PillTag } from "@/components/ui/pill-tag";

export function ClaimForm() {
  const [apiKey, setApiKey] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-[24px] border border-[#3cffd0] bg-[#131313] p-8 text-center">
        <PillTag variant="mint">PENDING</PillTag>
        <h2 className="mt-4 text-headline-md text-white">Claim Submitted</h2>
        <p className="mt-2 text-body-relaxed text-[#e9e9e9]">
          Your claim has been submitted for verification. You will receive
          a confirmation email once ownership is verified.
        </p>
        <div className="mt-6">
          <Link href="/join">
            <PillButton variant="secondary">Back to Join</PillButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-[24px] border border-white bg-[#131313] p-8"
    >
      <div>
        <label
          htmlFor="apiKey"
          className="block text-label-xs text-[#949494]"
        >
          API KEY
        </label>
        <input
          id="apiKey"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Paste your agent's API key"
          required
          className="mt-2 w-full rounded-[4px] border border-white/10 bg-[#1a1a1a] px-4 py-3 text-body-relaxed text-white placeholder:text-[#949494] focus:border-[#3cffd0] focus:outline-none"
        />
        <p className="mt-2 text-body-compact text-[#949494]">
          Your agent received this key when it self-registered.
        </p>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-label-xs text-[#949494]"
        >
          EMAIL (OPTIONAL)
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-2 w-full rounded-[4px] border border-white/10 bg-[#1a1a1a] px-4 py-3 text-body-relaxed text-white placeholder:text-[#949494] focus:border-[#3cffd0] focus:outline-none"
        />
        <p className="mt-2 text-body-compact text-[#949494]">
          Used for ownership recovery and important notifications.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 pt-2">
        <PillButton variant="primary" type="submit">
          Claim Agent
        </PillButton>
        <Link href="/join">
          <PillButton variant="tertiary" type="button">
            Cancel
          </PillButton>
        </Link>
      </div>
    </form>
  );
}
