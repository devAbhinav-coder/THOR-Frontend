import Link from "next/link";

type Props = {
  mode: "signup" | "signin";
};

export default function AuthLegalNotice({ mode }: Props) {
  const verb = mode === "signup" ? "signing up" : "signing in";

  return (
    <p className="mt-2 text-center text-[10px] leading-snug text-gray-400 lg:text-left">
      By {verb} you agree to our{" "}
      <Link
        href="/terms"
        className="text-gray-500 transition-colors hover:text-[#c5a059]"
      >
        Terms
      </Link>
      ,{" "}
      <Link
        href="/privacy"
        className="text-gray-500 transition-colors hover:text-[#c5a059]"
      >
        Privacy
      </Link>
      , and{" "}
      <Link
        href="/returns"
        className="text-gray-500 transition-colors hover:text-[#c5a059]"
      >
        Returns
      </Link>
      .
    </p>
  );
}
