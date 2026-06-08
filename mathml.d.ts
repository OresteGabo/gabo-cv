import type { HTMLAttributes } from "react";

type MathMLProps = HTMLAttributes<MathMLElement> & {
  display?: "block" | "inline";
  rowspacing?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      math: MathMLProps;
      mfrac: MathMLProps;
      mi: MathMLProps;
      mn: MathMLProps;
      mo: MathMLProps;
      mrow: MathMLProps;
      msub: MathMLProps;
      msubsup: MathMLProps;
      msup: MathMLProps;
      mtable: MathMLProps;
      mtd: MathMLProps;
      mtext: MathMLProps;
      mtr: MathMLProps;
      munderover: MathMLProps;
    }
  }
}
