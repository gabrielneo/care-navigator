import Link from "next/link";

export default function NotFound() {
  return (
    <div className="scr">
      <h1>We can't find that page.</h1>
      <Link className="btn" href="/plan/">Start planning</Link>
      <Link className="btn sec" href="/">Go to home</Link>
    </div>
  );
}
