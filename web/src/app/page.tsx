import Link from "next/link";
import { Hero3D } from "@/components/start/Hero3D";

export default function Start() {
  return (
    <>
      <section className="hero">
        <h1>Plan care for someone you look after</h1>
        <p>
          See which services fit, what they may cost after the 2026 subsidies, and who to call first. About 5 minutes.
          Nothing you enter is saved.
        </p>
        <Link className="btn" href="/plan/">Start planning</Link>
        <Hero3D />
      </section>
      <div className="scr">
        <p className="help">Planning for two people? Make one plan for each, then share both links.</p>
      </div>
    </>
  );
}
