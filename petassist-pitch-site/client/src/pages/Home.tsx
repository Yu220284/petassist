/**
 * Petassist — Workbench of Trust
 * Design reminder: make permissions tangible through tactile desk objects, clear states,
 * warm paper surfaces, ink-navy typography, and Petassist Orange as the decision signal.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CircleCheckBig,
  Eye,
  FilePenLine,
  LockKeyhole,
  PawPrint,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type AgentId = "cat" | "bunny" | "dog";
type RunState = "idle" | "blocked" | "drafted" | "waiting" | "approved";

const agents: Record<
  AgentId,
  {
    name: string;
    role: string;
    access: string;
    scope: string;
    model: string;
    icon: typeof Eye;
    note: string;
  }
> = {
  cat: {
    name: "Mochi",
    role: "Investigate",
    access: "OBSERVE ONLY",
    scope: "Read · /project",
    model: "reasoning model",
    icon: Eye,
    note: "I can investigate. I cannot send.",
  },
  bunny: {
    name: "Pip",
    role: "Draft",
    access: "DRAFT ONLY",
    scope: "Write · /drafts",
    model: "fast model",
    icon: FilePenLine,
    note: "I prepare the words. Nothing leaves.",
  },
  dog: {
    name: "Wally",
    role: "Ship",
    access: "ALLOW TO SEND",
    scope: "Send · selected apps",
    model: "tool model",
    icon: Send,
    note: "I go outside only after you allow it.",
  },
};

const runMessages: Record<Exclude<RunState, "idle">, { title: string; detail: string }> = {
  blocked: {
    title: "Stopped where it should.",
    detail: "Mochi inspected the request, but does not have permission to send it.",
  },
  drafted: {
    title: "Draft ready. Still inside.",
    detail: "Pip wrote the update in /drafts. No channel has been touched.",
  },
  waiting: {
    title: "Ready at the threshold.",
    detail: "Wally prepared the action. It will leave the desk only after Allow.",
  },
  approved: {
    title: "Allowed — and recorded.",
    detail: "The task went out only after your explicit approval.",
  },
};

const fearCards = [
  ["I don’t know what to allow.", "Every agent shows its exact lane before it starts."],
  ["It changed the wrong thing.", "The workspace boundary travels with the pet."],
  ["I can’t see what changed.", "Work and status stay on the desk, not buried in logs."],
];

function scrollToDesk() {
  document.getElementById("desk")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export default function Home() {
  const [activeAgent, setActiveAgent] = useState<AgentId>("cat");
  const [runState, setRunState] = useState<RunState>("idle");
  const agent = agents[activeAgent];
  const AgentIcon = agent.icon;

  const selectAgent = (id: AgentId) => {
    setActiveAgent(id);
    setRunState("idle");
  };

  const runTask = () => {
    setRunState(activeAgent === "cat" ? "blocked" : activeAgent === "bunny" ? "drafted" : "waiting");
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Petassist home">
          <img src="/manus-storage/petassist-mark_1085b0b8.png" alt="" />
          <span>pet<span>assist</span></span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#why">Why this exists</a>
          <a href="#team">Meet the team</a>
          <a href="#under-the-hood">Built with</a>
        </nav>
        <Button className="nav-cta" onClick={scrollToDesk}>
          Open the desk <ArrowDownRight aria-hidden="true" />
        </Button>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <motion.p
              className="eyebrow"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              AI teammates, on a shorter leash
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.06 }}
            >
              Trust your AI.<br />
              <em>Keep the leash.</em>
            </motion.h1>
            <motion.p
              className="hero-lede"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
            >
              Petassist turns invisible permissions into teammates you can see. Put an agent on your desk, give it the smallest license it needs, and always know what happens next.
            </motion.p>
            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
            >
              <Button className="primary-action" onClick={scrollToDesk}>
                Try the permission desk <ArrowDownRight aria-hidden="true" />
              </Button>
              <a href="#why" className="text-action">Why pets? <ArrowDownRight aria-hidden="true" /></a>
            </motion.div>
            <motion.div
              className="trust-strip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.34 }}
            >
              <ShieldCheck aria-hidden="true" />
              <span>Scope first</span><i />
              <LockKeyhole aria-hidden="true" />
              <span>Approval before outside actions</span>
            </motion.div>
          </div>

          <motion.div
            className="hero-workbench"
            initial={{ opacity: 0, rotate: 1.5, y: 24 }}
            animate={{ opacity: 1, rotate: 0, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="desk-tape">YOUR DESK · YOUR RULES</div>
            <div className="hero-visual" aria-hidden="true">
              <img src="/manus-storage/petassist-desk-hero_208c803f.png" alt="" />
            </div>
            <div className="desk-window" id="desk">
              <div className="window-topline">
                <span className="window-dots"><b /><b /><b /></span>
                <span>petassist / desk</span>
                <span className="live-dot"><i /> live</span>
              </div>
              <div className="desk-window-content">
                <div className="task-label">Choose a teammate</div>
                <div className="pet-switcher" role="tablist" aria-label="Choose an AI teammate">
                  {(Object.keys(agents) as AgentId[]).map((id) => {
                    const item = agents[id];
                    const Icon = item.icon;
                    return (
                      <button
                        key={id}
                        role="tab"
                        aria-selected={activeAgent === id}
                        className={`pet-tab ${id} ${activeAgent === id ? "active" : ""}`}
                        onClick={() => selectAgent(id)}
                      >
                        <span className="pet-orb"><PawPrint aria-hidden="true" /></span>
                        <span><strong>{item.name}</strong><small>{item.role}</small></span>
                      </button>
                    );
                  })}
                </div>
                <div className={`permission-panel ${activeAgent}`}>
                  <div className="tether-line" aria-hidden="true"><span /></div>
                  <div className="permission-heading">
                    <span className="permission-icon"><AgentIcon aria-hidden="true" /></span>
                    <div><small>{agent.name} can</small><strong>{agent.access}</strong></div>
                    <span className="model-chip">{agent.model}</span>
                  </div>
                  <div className="scope-row"><span>WORKSPACE</span><code>{agent.scope}</code></div>
                  <p>{agent.note}</p>
                </div>
                <div className="job-card">
                  <div><span>JOB</span><strong>Review release notes &amp; notify the team</strong></div>
                  <Button className="run-button" onClick={runTask}>Run <ArrowUpRight aria-hidden="true" /></Button>
                </div>
                {runState !== "idle" && (
                  <motion.div
                    className={`task-result ${runState}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {runState === "blocked" ? <X aria-hidden="true" /> : <CircleCheckBig aria-hidden="true" />}
                    <div><strong>{runMessages[runState].title}</strong><span>{runMessages[runState].detail}</span></div>
                    {runState === "waiting" && <Button className="allow-button" onClick={() => setRunState("approved")}>Allow <Check aria-hidden="true" /></Button>}
                  </motion.div>
                )}
              </div>
            </div>
            <div className="floating-scope cat">READ ONLY</div>
            <div className="floating-scope dog">ALLOW REQUIRED</div>
          </motion.div>
        </section>

        <section className="problem-section" id="why">
          <div className="problem-intro">
            <p className="eyebrow">The trust gap</p>
            <h2>The scary part isn’t the AI.<br /><em>It’s the unknown.</em></h2>
          </div>
          <div className="problem-list">
            {fearCards.map(([title, text], index) => (
              <article className={`fear-card fear-${index + 1}`} key={title}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
                <div className="card-corner" aria-hidden="true" />
              </article>
            ))}
          </div>
          <p className="problem-close">Most agents ask for access in the abstract. <strong>Petassist makes the boundary visible before the work starts.</strong></p>
        </section>

        <section className="rule-section">
          <div className="rule-mark"><PawPrint aria-hidden="true" /></div>
          <p>ONE PET <i /> ONE JOB <i /> JUST ENOUGH ACCESS</p>
          <span>This is the rule that keeps your desk calm.</span>
        </section>

        <section className="team-section" id="team">
          <div className="section-title-block">
            <div>
              <p className="eyebrow">Permission is a personality trait</p>
              <h2>Meet the team<br />that knows its lane.</h2>
            </div>
            <p>Not every task deserves the same access — or the same reasoning. Assign work to the teammate that has the right model and the minimum license to finish it.</p>
          </div>
          <div className="team-stage">
            <div className="lane-desk" aria-label="Petassist permission lanes">
              <div className="desk-pin pin-one" aria-hidden="true" />
              <div className="desk-pin pin-two" aria-hidden="true" />
              <div className="lane-row cat-lane">
                <div className="lane-pet cat"><span className="pet-ears" /><PawPrint aria-hidden="true" /></div>
                <div className="tether-segment"><i /><b /></div>
                <div className="lane-scope"><small>WORKSPACE</small><strong>/project · read</strong></div>
                <div className="lane-stop"><Eye aria-hidden="true" /><span>INSIDE</span></div>
              </div>
              <div className="lane-row bunny-lane">
                <div className="lane-pet bunny"><span className="pet-ears" /><PawPrint aria-hidden="true" /></div>
                <div className="tether-segment"><i /><b /></div>
                <div className="lane-scope"><small>WORKSPACE</small><strong>/drafts · write</strong></div>
                <div className="lane-stop"><FilePenLine aria-hidden="true" /><span>INSIDE</span></div>
              </div>
              <div className="lane-row dog-lane">
                <div className="lane-pet dog"><span className="pet-ears" /><PawPrint aria-hidden="true" /></div>
                <div className="tether-segment"><i /><b /></div>
                <div className="lane-scope"><small>THRESHOLD</small><strong>Slack · send</strong></div>
                <div className="lane-stop allow"><Send aria-hidden="true" /><span>ASK FIRST</span></div>
              </div>
              <div className="lane-caption"><span>scope travels with the pet</span><ArrowDownRight aria-hidden="true" /></div>
            </div>
            <div className="team-roles">
              <article className="agent-note cat-note">
                <div className="agent-note-top"><span className="mini-pet cat"><PawPrint /></span><span>01 / CAT</span></div>
                <h3>Mochi investigates.</h3>
                <p>Reads the project, follows clues, and reports back. No outbound action. No surprise edits.</p>
                <span className="stamp sage">OBSERVE ONLY</span>
              </article>
              <article className="agent-note bunny-note">
                <div className="agent-note-top"><span className="mini-pet bunny"><PawPrint /></span><span>02 / BUNNY</span></div>
                <h3>Pip makes a first pass.</h3>
                <p>Writes a useful reply or release note, then leaves it right where you can review it.</p>
                <span className="stamp blue">DRAFT ONLY</span>
              </article>
              <article className="agent-note dog-note">
                <div className="agent-note-top"><span className="mini-pet dog"><PawPrint /></span><span>03 / DOG</span></div>
                <h3>Wally goes outside.</h3>
                <p>Uses the external tools you chose. The last step always pauses at your approval.</p>
                <span className="stamp orange">ALLOW TO SEND</span>
              </article>
            </div>
          </div>
        </section>

        <section className="how-section">
          <div className="how-tape">MAKE THE INVISIBLE OPERABLE</div>
          <div className="how-copy">
            <p className="eyebrow">A tiny ritual for bigger trust</p>
            <h2>Ask in chat.<br />See what it needs.<br /><em>Then decide.</em></h2>
          </div>
          <ol className="steps-list">
            <li><span>01</span><div><h3>Describe the work.</h3><p>Use plain language. No need to calculate every permission up front.</p></div><ArrowDownRight aria-hidden="true" /></li>
            <li><span>02</span><div><h3>Pick the right pet.</h3><p>Petassist sends the job to the model and access lane that match it.</p></div><ArrowDownRight aria-hidden="true" /></li>
            <li><span>03</span><div><h3>Approve the threshold.</h3><p>When work needs to leave your desk, the agent asks rather than assumes.</p></div><ArrowDownRight aria-hidden="true" /></li>
          </ol>
        </section>

        <section className="proof-section" id="under-the-hood">
          <div className="proof-copy">
            <p className="eyebrow">Built for the real desktop</p>
            <h2>Soft on the surface.<br /><em>Serious underneath.</em></h2>
            <p>Petassist is a prototype for agents that feel as understandable as a teammate sitting beside you — with tools built to keep the work scoped, observable, and interruptible.</p>
          </div>
          <div className="architecture-board">
            <div className="board-title"><span>THE PIPE</span><i /></div>
            <div className="architecture-flow">
              <div className="architecture-node electron"><small>POCKET WINDOW</small><strong>Electron</strong><span>sticky agents</span></div>
              <ArrowDownRight aria-hidden="true" />
              <div className="architecture-node next"><small>THE DESK</small><strong>Next.js</strong><span>clear interface</span></div>
              <ArrowDownRight aria-hidden="true" />
              <div className="architecture-node forge"><small>THE PIPE</small><strong>TrueForge</strong><span>scoped work loop</span></div>
              <ArrowDownRight aria-hidden="true" />
              <div className="architecture-node model"><small>THE PET</small><strong>Model</strong><span>right brain, right job</span></div>
            </div>
            <div className="board-foot"><Sparkles aria-hidden="true" /> Designed at a hackathon for people who want agentic work without blind faith.</div>
          </div>
        </section>

        <section className="closing-section">
          <div className="closing-visual" aria-label="A Petassist agent waiting for user approval">
            <div className="closing-desk-pin" aria-hidden="true" />
            <div className="closing-tape">WAITING AT THE THRESHOLD</div>
            <div className="closing-pet-card">
              <div className="closing-pet dog"><span className="pet-ears" /><PawPrint aria-hidden="true" /></div>
              <div><small>WALLY / SHIP</small><strong>Release notes are ready.</strong><span>Slack · #team-updates</span></div>
            </div>
            <div className="closing-tether"><i /><b /><span>YOUR APPROVAL</span></div>
            <div className="closing-threshold"><LockKeyhole aria-hidden="true" /><strong>OUTSIDE<br />YOUR DESK</strong><small>still waiting</small></div>
            <div className="closing-stamp">ALLOW</div>
          </div>
          <div className="closing-copy">
            <p className="eyebrow">Stick it on the desk</p>
            <h2>An AI teammate<br />you can <em>actually</em> trust.</h2>
            <p>Keep the work close. Give it just enough room to help. Petassist works for you — not around you.</p>
            <div className="closing-actions">
              <Button className="primary-action" onClick={scrollToDesk}>Meet your pets <ArrowUpRight aria-hidden="true" /></Button>
              <a href="https://github.com/Yu220284/petassist" target="_blank" rel="noreferrer" className="text-action">View on GitHub <ArrowUpRight aria-hidden="true" /></a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <a className="brand" href="#top"><img src="/manus-storage/petassist-mark_1085b0b8.png" alt="" /><span>pet<span>assist</span></span></a>
        <p>Built at a hackathon for a more legible kind of AI assistance.</p>
        <a href="#top">Back to top <ArrowUpRight aria-hidden="true" /></a>
      </footer>
    </div>
  );
}
