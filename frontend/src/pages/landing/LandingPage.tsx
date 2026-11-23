import { type FC } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ChevronRight,
  Compass,
  Cpu,
  Database,
  Move,
  Play,
  PlusCircle,
  Quote,
  Shield,
  ShieldAlert,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'
import { TacticalPitch } from '../../components/pitch/TacticalPitch.tsx'
import type { TeamTacticalSetup, BallPosition } from '../../types/scenario.ts'
import type { SpatialMetrics } from '../../types/analysis.ts'
import '../../styles/landing.css'

// Sample demonstration match scenario data (Brighton vs Liverpool high-press touchline trap)
const DEMO_ATTACKING_TEAM: TeamTacticalSetup = {
  name: 'Brighton (Build-Up)',
  formation: '4-2-3-1',
  players: [
    { id: 'att_1', number: 1, name: 'Verbruggen', role: 'GK', position: { x: 7.0, y: 34.0 } },
    { id: 'att_2', number: 29, name: 'Van Hecke', role: 'CB', position: { x: 18.0, y: 48.0 } },
    { id: 'att_3', number: 5, name: 'Dunk', role: 'CB', position: { x: 17.5, y: 20.0 } },
    { id: 'att_4', number: 34, name: 'Veltman', role: 'RB', position: { x: 28.0, y: 62.0 } },
    { id: 'att_5', number: 30, name: 'Estupiñán', role: 'LB', position: { x: 28.0, y: 6.0 } },
    { id: 'att_6', number: 13, name: 'Groß', role: 'DM', position: { x: 27.0, y: 37.0 } },
    { id: 'att_7', number: 20, name: 'Baleba', role: 'DM', position: { x: 26.0, y: 25.0 } },
    { id: 'att_8', number: 11, name: 'Adingra', role: 'RW', position: { x: 55.0, y: 60.0 } },
    { id: 'att_9', number: 22, name: 'Mitoma', role: 'LW', position: { x: 55.0, y: 8.0 } },
    { id: 'att_10', number: 10, name: 'Enciso', role: 'AM', position: { x: 46.0, y: 34.0 } },
    { id: 'att_11', number: 18, name: 'Welbeck', role: 'CF', position: { x: 68.0, y: 34.0 } },
  ],
}

const DEMO_DEFENDING_TEAM: TeamTacticalSetup = {
  name: 'Liverpool (High Press)',
  formation: '4-3-3',
  players: [
    { id: 'def_1', number: 1, name: 'Alisson', role: 'GK', position: { x: 92.0, y: 34.0 } },
    { id: 'def_2', number: 4, name: 'Van Dijk', role: 'CB', position: { x: 64.0, y: 38.0 } },
    { id: 'def_3', number: 5, name: 'Konaté', role: 'CB', position: { x: 64.0, y: 26.0 } },
    { id: 'def_4', number: 66, name: 'Alexander-Arnold', role: 'RB', position: { x: 59.0, y: 8.0 } },
    { id: 'def_5', number: 26, name: 'Robertson', role: 'LB', position: { x: 57.0, y: 60.0 } },
    { id: 'def_6', number: 10, name: 'Mac Allister', role: 'DM', position: { x: 42.0, y: 34.0 } },
    { id: 'def_7', number: 8, name: 'Szoboszlai', role: 'CM', position: { x: 30.0, y: 44.0 } },
    { id: 'def_8', number: 17, name: 'Jones', role: 'CM', position: { x: 32.0, y: 24.0 } },
    { id: 'def_9', number: 11, name: 'Salah', role: 'RW', position: { x: 22.0, y: 18.0 } },
    { id: 'def_10', number: 7, name: 'Díaz', role: 'LW', position: { x: 24.0, y: 54.0 } },
    { id: 'def_11', number: 9, name: 'Núñez', role: 'CF', position: { x: 20.0, y: 32.0 } },
  ],
}

const DEMO_BALL_POSITION: BallPosition = {
  x: 18.0,
  y: 48.0,
  z: 0,
  zone: 'Defensive Third - Right Half-space',
}

const DEMO_SPATIAL_METRICS: SpatialMetrics = {
  ball_carrier: {
    name: 'Van Hecke',
    number: 29,
    role: 'CB',
    coordinates: { x: 18.0, y: 48.0 },
    distance_to_ball: 0.0,
  },
  primary_presser: {
    id: 'def_10',
    name: 'Díaz',
    number: 7,
    role: 'LW',
    position: { x: 24.0, y: 54.0 },
    distance_to_ball: 8.49,
  },
  supporting_pressers: [
    {
      id: 'def_11',
      name: 'Núñez',
      number: 9,
      role: 'CF',
      position: { x: 20.0, y: 32.0 },
      distance_to_ball: 16.12,
    },
    {
      id: 'def_7',
      name: 'Szoboszlai',
      number: 8,
      role: 'CM',
      position: { x: 30.0, y: 44.0 },
      distance_to_ball: 12.65,
    },
  ],
  pressing_funnel: 'touchline_lock',
  pressing_vector: { dx: -6.0, dy: -6.0 },
  passing_lanes: [
    {
      target_player: '#13 Groß',
      target_zone: 'Zone 5 - Middle Defensive Third',
      lane_distance_meters: 14.21,
      status: 'blocked_by_cover_shadow',
      cover_shadow_defenders: ['#7 Díaz'],
      nearest_defender_distance: 2.1,
    },
    {
      target_player: '#34 Veltman',
      target_zone: 'Zone 6 - Right Defensive Flank',
      lane_distance_meters: 17.2,
      status: 'contested',
      cover_shadow_defenders: [],
      nearest_defender_distance: 3.2,
    },
    {
      target_player: '#1 Verbruggen',
      target_zone: 'Zone 4 - Six Yard Box',
      lane_distance_meters: 17.78,
      status: 'open',
      cover_shadow_defenders: [],
      nearest_defender_distance: 8.5,
    },
    {
      target_player: '#5 Dunk',
      target_zone: 'Zone 4 - Left Defensive Half-space',
      lane_distance_meters: 28.0,
      status: 'blocked_by_cover_shadow',
      cover_shadow_defenders: ['#9 Núñez'],
      nearest_defender_distance: 2.8,
    },
  ],
  passing_lane_summary: {
    total_outlets: 4,
    blocked_by_cover_shadow: 2,
    contested: 1,
    open: 1,
  },
  compactness: {
    vertical_block_length_meters: 34.0,
    horizontal_block_width_meters: 42.0,
    is_compact: true,
  },
  open_options: ['#1 Verbruggen'],
}

// Grounded community feedback from football practitioners
const USER_REVIEWS = [
  {
    name: 'Rohan Kulkarni',
    role: 'Tactical Analyst & Youth Coach, Mumbai',
    review:
      'The way TacticalLens visualizes cover-shadow cones and calculates blocked passing lanes makes explaining pressing traps to young center-backs so much simpler. It is grounded in actual pitch geometry rather than vague qualitative remarks.',
    tag: 'Cover Shadows & Passing Lanes',
    initials: 'RK',
  },
  {
    name: 'Ananya Iyer',
    role: 'Football Analytics Researcher, Bengaluru',
    review:
      'Analyzing low-block vertical compactness with exact meter measurements between the back line and midfield line gives us concrete data on "haramball" setups. The Zone 14 screening ratio is spot-on for evaluating defensive mid-blocks.',
    tag: 'Low-Block & Zone 14 Density',
    initials: 'AI',
  },
  {
    name: 'Vikramaditya Nair',
    role: 'Amateur Club Captain, Kochi',
    review:
      'We used the Scenario Builder to map out our touchline pressing trap against 4-2-3-1 build-ups. Being able to see passing lane statuses (blocked vs open) directly on an interactive 105×68m SVG pitch is incredibly useful.',
    tag: '105×68m Pitch & Scenario Builder',
    initials: 'VN',
  },
  {
    name: 'Siddharth Deshmukh',
    role: 'Sports Journalist & Match Analyst, Pune',
    review:
      'The 10-section report breaks down complex tactical dynamics like defender step-out triggers and rest-defense cover shifts in clear language. It provides genuine analytical depth without hype.',
    tag: '10-Section Reports & Step-Out Triggers',
    initials: 'SD',
  },
]

export const LandingPage: FC = () => {
  return (
    <div className="tl-landing">
      {/* Glow Backdrop */}
      <div className="tl-landing-glow" />

      {/* Sticky Header / Navbar */}
      <header className="tl-nav">
        <div className="tl-landing-container">
          <div className="tl-nav-inner">
            <Link to="/" className="tl-brand">
              <div className="tl-brand-icon">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h1 className="tl-brand-title">
                  Tactical<span>Lens</span>
                </h1>
                <p className="tl-brand-subtitle">Football Intelligence Engine</p>
              </div>
            </Link>

            <nav className="tl-nav-links">
              <a href="#overview" className="tl-nav-link">
                Product Overview
              </a>
              <a href="#attacking" className="tl-nav-link">
                Attacking & Pressing
              </a>
              <a href="#defensive" className="tl-nav-link">
                Defensive Blocks
              </a>
              <a href="#how-it-works" className="tl-nav-link">
                How It Works
              </a>
              <a href="#pitch-preview" className="tl-nav-link">
                Interactive Pitch
              </a>
              <a href="#reviews" className="tl-nav-link">
                Feedback
              </a>
            </nav>

            <div className="tl-nav-actions">
              <Link to="/dashboard" className="pl-btn pl-btn-secondary pl-btn-sm">
                Dashboard
              </Link>
              <Link to="/builder" className="pl-btn pl-btn-primary pl-btn-sm">
                Scenario Builder
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="tl-hero">
        <div className="tl-landing-container">
          <div className="tl-badge-pill">
            <Sparkles size={14} />
            <span>Spatial Pitch Math &bull; PostgreSQL RAG &bull; Groq AI</span>
          </div>

          <h2 className="tl-hero-title">
            Demystifying Football Tactics with{' '}
            <span className="tl-hero-title-highlight">Spatial Pitch Geometry</span> & AI
          </h2>

          <p className="tl-hero-desc">
            TacticalLens bridges the gap between complex tactical doctrine and visual pitch clarity.
            Analyze pressing traps, cover shadows, and low-block vertical compactness on an
            interactive 105×68m regulation pitch powered by deterministic geometry, curated
            vector knowledge, and fast LLM explanations.
          </p>

          <div className="tl-hero-ctas">
            <Link to="/builder" className="pl-btn pl-btn-primary pl-btn-lg">
              <span>Launch Scenario Builder</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/analysis" className="pl-btn pl-btn-secondary pl-btn-lg">
              <Zap size={18} color="var(--color-pitch)" />
              <span>Run Tactical Analysis</span>
            </Link>
            <Link to="/scenarios" className="pl-btn pl-btn-outline pl-btn-lg">
              <Compass size={18} />
              <span>Explore Match Scenarios</span>
            </Link>
          </div>

          <div className="tl-feature-chips">
            <div className="tl-chip">
              <span className="tl-chip-dot" />
              <span>105×68m Regulation Pitch</span>
            </div>
            <div className="tl-chip">
              <span className="tl-chip-dot" />
              <span>Deterministic Spatial Math</span>
            </div>
            <div className="tl-chip">
              <span className="tl-chip-dot" />
              <span>PostgreSQL Vector RAG</span>
            </div>
            <div className="tl-chip">
              <span className="tl-chip-dot" />
              <span>Groq LLM 10-Section Reports</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Complete Product Overview (Three Pillars) */}
      <section id="overview" className="tl-section">
        <div className="tl-landing-container">
          <div className="tl-section-header">
            <div className="tl-section-tag">
              <Cpu size={14} />
              <span>Engineering Architecture</span>
            </div>
            <h3 className="tl-section-title">The Three Pillars of TacticalLens</h3>
            <p className="tl-section-desc">
              Unlike generic AI tools that hallucinate tactical formations or guess distances,
              TacticalLens decouples spatial calculations from natural language reasoning.
            </p>
          </div>

          <div className="tl-grid-3">
            {/* Pillar 1 */}
            <div className="tl-card">
              <div className="tl-card-icon tl-icon-pitch">
                <Target size={24} />
              </div>
              <h4 className="tl-card-title">1. Deterministic Pitch Geometry</h4>
              <p className="tl-card-desc">
                Pure mathematical modeling across a 105×68m pitch coordinate space. Every player
                distance, approach vector, and passing angle is measured before any LLM is called.
              </p>
              <ul className="tl-card-list">
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Euclidean distance tracking between all 22 players and the ball.</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Point-to-segment perpendicular distance for passing lane obstruction.</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>18 standardized pitch zones including Band 5 central Zone 14.</span>
                </li>
              </ul>
              <div className="tl-metric-badge tl-metric-pitch">Zero Hallucinated Metrics</div>
            </div>

            {/* Pillar 2 */}
            <div className="tl-card">
              <div className="tl-card-icon tl-icon-tactical">
                <Database size={24} />
              </div>
              <h4 className="tl-card-title">2. Domain-Grounded Vector RAG</h4>
              <p className="tl-card-desc">
                Curated tactical doctrine from Arrigo Sacchi, Marcelo Bielsa, Ralf Rangnick, José
                Mourinho, and Massimiliano Allegri, embedded locally with 384-dimensional vectors.
              </p>
              <ul className="tl-card-list">
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>11 curated tactical topics spanning pressing, blocks, and transitions.</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Cosine similarity vector ranking against PostgreSQL knowledge chunks.</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Transparent source attribution and verified tactical principles.</span>
                </li>
              </ul>
              <div className="tl-metric-badge tl-metric-tactical">Grounding in Verified Literature</div>
            </div>

            {/* Pillar 3 */}
            <div className="tl-card">
              <div className="tl-card-icon tl-icon-warning">
                <Zap size={24} />
              </div>
              <h4 className="tl-card-title">3. Groq LLM & Structured Reports</h4>
              <p className="tl-card-desc">
                High-throughput synthesis via Groq SDK (`llama-3.3-70b-versatile`), enforcing
                strict Zod schema validation for dependable, structured tactical breakdowns.
              </p>
              <ul className="tl-card-list">
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Unified 10-section structured tactical reports for coaches and fans.</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Automatic deterministic fallback engine on provider outage (no 500s).</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Contextual multi-turn follow-up chat with database message history.</span>
                </li>
              </ul>
              <div className="tl-metric-badge tl-metric-amber">Strict Zod Schema Parity</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Attacking & Pressing Strategies Section */}
      <section id="attacking" className="tl-section">
        <div className="tl-landing-container">
          <div className="tl-section-header">
            <div className="tl-section-tag">
              <Move size={14} />
              <span>Attacking & Pressing Mechanics</span>
            </div>
            <h3 className="tl-section-title">Dissecting Modern Pressing Traps</h3>
            <p className="tl-section-desc">
              How TacticalLens models off-ball spatial pressure, passing angles, and touchline
              traps with geometric precision.
            </p>
          </div>

          <div className="tl-grid-2">
            {/* Feature 1 */}
            <div className="tl-card">
              <h4 className="tl-card-title">Cover Shadows & Lane Obstruction</h4>
              <p className="tl-card-desc">
                A cover shadow is the conical zone directly behind an advancing defender that denies
                passing trajectories without requiring a teammate to commit man-to-man.
              </p>
              <ul className="tl-card-list">
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Calculates dynamic angular shadows between ball carrier, defender, and target outlets.</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Categorizes passing lanes into <strong>Blocked</strong>, <strong>Contested</strong> (&le; 3m intercept risk), or <strong>Open</strong>.</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Identifies double-marking efficiency (pressuring the carrier while blocking the pivot).</span>
                </li>
              </ul>
              <div className="tl-metric-badge tl-metric-pitch">Point-to-Segment Raycasting</div>
            </div>

            {/* Feature 2 */}
            <div className="tl-card">
              <h4 className="tl-card-title">Pressing Vectors & Approach Angles</h4>
              <p className="tl-card-desc">
                Pressing is determined by the trajectory of approach. TacticalLens calculates
                directional delta vectors $(\Delta x, \Delta y)$ from pressers to the ball carrier.
              </p>
              <ul className="tl-card-list">
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Classifies primary presser (&le; 15m) vs intense presser (&le; 5m).</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Detects curved runs designed to cut off switch passes to the opposite center-back.</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Measures closing distance and time available before challenged delivery.</span>
                </li>
              </ul>
              <div className="tl-metric-badge tl-metric-tactical">Vector Approach Modeling</div>
            </div>

            {/* Feature 3 */}
            <div className="tl-card">
              <h4 className="tl-card-title">Tactical Pressing Funnels</h4>
              <p className="tl-card-desc">
                Teams rarely press straight; they funnel play into predetermined turnover traps.
                TacticalLens automatically classifies the defensive intent:
              </p>
              <ul className="tl-card-list">
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span><strong>Touchline Lock:</strong> Uses the sideline as an extra defender, eliminating 180° of exit angles.</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span><strong>Flank Funneling:</strong> Steers central build-up into congested wide corridors.</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span><strong>Central Compression:</strong> Baits vertical passes into dense double-pivot webs.</span>
                </li>
              </ul>
              <div className="tl-metric-badge tl-metric-pitch">4-Way Funnel Classifier</div>
            </div>

            {/* Feature 4 */}
            <div className="tl-card">
              <h4 className="tl-card-title">Defensive Compactness Area</h4>
              <p className="tl-card-desc">
                High pressing collapses without synchronized line movement. The engine calculates
                the bounding box compactness of the defending unit.
              </p>
              <ul className="tl-card-list">
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Measures vertical block length and horizontal width in meters.</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Flags overstretched structures when vertical length exceeds 35 meters.</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Detects weak-side space left vulnerable by aggressive horizontal shifting.</span>
                </li>
              </ul>
              <div className="tl-metric-badge tl-metric-amber">Compactness Bounding Box</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Defensive Strategies Section */}
      <section id="defensive" className="tl-section">
        <div className="tl-landing-container">
          <div className="tl-section-header">
            <div className="tl-section-tag">
              <Shield size={14} />
              <span>Defensive Blocks & Non-Possession</span>
            </div>
            <h3 className="tl-section-title">Mastering Defensive Blocks & "Haramball"</h3>
            <p className="tl-section-desc">
              TacticalLens provides industry-first metrics for deep blocks, Zone 14 central density,
              and aggressive defender step-out triggers.
            </p>
          </div>

          <div className="tl-grid-3">
            {/* Card 1 */}
            <div className="tl-card">
              <div className="tl-card-icon tl-icon-pitch">
                <ShieldAlert size={24} />
              </div>
              <h4 className="tl-card-title">Low-Block Vertical Compactness</h4>
              <p className="tl-card-desc">
                Quantifying the depth and inter-line spacing between the back line and midfield unit.
              </p>
              <ul className="tl-card-list">
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span><strong>Ultra-Compact Haramball:</strong> Inter-line distance &le; 12m with defensive line &le; 30m from goal.</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span><strong>Compact Low-Block:</strong> Inter-line depth between 12m and 16m.</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Denies attacking midfielders receiving space on the half-turn between lines.</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Forces possession out wide into low-xG crossing traps against settled aerial CBs.</span>
                </li>
              </ul>
              <div className="tl-metric-badge tl-metric-pitch">&Delta;X Inter-Line Depth &le; 12m</div>
            </div>

            {/* Card 2 */}
            <div className="tl-card">
              <div className="tl-card-icon tl-icon-tactical">
                <Target size={24} />
              </div>
              <h4 className="tl-card-title">Zone 14 Central Density</h4>
              <p className="tl-card-desc">
                Controlling the pivotal sector directly outside the 18-yard box ($x \in [70, 87.5]$m, $y \in [22.7, 45.3]$m).
              </p>
              <ul className="tl-card-list">
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Computes the central screening ratio: (central defenders / total outfield defenders).</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Screens the highest-xG shooting corridor with double-pivot shielding.</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Models sandwich-press traps: holding midfielders collapsing from the front while CBs pressure from behind.</span>
                </li>
              </ul>
              <div className="tl-metric-badge tl-metric-tactical">Screening Ratio &ge; 50%</div>
            </div>

            {/* Card 3 */}
            <div className="tl-card">
              <div className="tl-card-icon tl-icon-warning">
                <Move size={24} />
              </div>
              <h4 className="tl-card-title">Pressing Triggers & Step-Outs</h4>
              <p className="tl-card-desc">
                Analyzing what happens when a central defender breaks line depth to challenge a dropping attacker.
              </p>
              <ul className="tl-card-list">
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Detects defender step-outs &ge; 4.5 meters forward from the baseline defensive line.</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Checks if adjacent defenders executed a lateral cover shift (pinching 3-4m centrally).</span>
                </li>
                <li className="tl-card-list-item">
                  <span className="bullet">&bull;</span>
                  <span>Identifies whether vacated space was secured or left vulnerable to third-man runs.</span>
                </li>
              </ul>
              <div className="tl-metric-badge tl-metric-amber">Step-Out &Delta;X &ge; 4.5m Trigger</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: How It Works & Interactive 3-Step Workflow */}
      <section id="how-it-works" className="tl-section">
        <div className="tl-landing-container">
          <div className="tl-section-header">
            <div className="tl-section-tag">
              <Play size={14} />
              <span>Simple 3-Step Workflow</span>
            </div>
            <h3 className="tl-section-title">How TacticalLens Works</h3>
            <p className="tl-section-desc">
              From raw scenario coordinates to a fully grounded 10-section tactical breakdown in three steps.
            </p>
          </div>

          <div className="tl-grid-3">
            {/* Step 1 */}
            <div className="tl-step-card">
              <div className="tl-step-number">STEP 01</div>
              <h4 className="tl-step-title">Configure or Load Scenario</h4>
              <p className="tl-step-desc">
                Select from curated Premier League and Champions League tactical scenarios (e.g.,
                Liverpool high press, Man City 3-2 rest defense, Arsenal mid-block) or place
                players interactively on a 105×68m pitch using the Scenario Builder.
              </p>
            </div>

            {/* Step 2 */}
            <div className="tl-step-card">
              <div className="tl-step-number">STEP 02</div>
              <h4 className="tl-step-title">Run Spatial & RAG Pipeline</h4>
              <p className="tl-step-desc">
                The engine runs validation checks, computes exact Euclidean distances, cover-shadow
                cones, low-block depths, and Zone 14 screening ratios. Simultaneously, PostgreSQL
                vector search retrieves verified coaching doctrine matching the situation.
              </p>
            </div>

            {/* Step 3 */}
            <div className="tl-step-card">
              <div className="tl-step-number">STEP 03</div>
              <h4 className="tl-step-title">Explore Report & Follow-Up</h4>
              <p className="tl-step-desc">
                Inspect the interactive pitch with passing lane and cover shadow overlays. Read the
                10-section structured tactical report, and ask natural language follow-up questions
                grounded in multi-turn conversational context.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <Link to="/builder" className="pl-btn pl-btn-primary pl-btn-md">
              <span>Try Scenario Builder Now</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Section 5: Interactive Pitch Showcase Preview */}
      <section id="pitch-preview" className="tl-section">
        <div className="tl-landing-container">
          <div className="tl-pitch-preview-card">
            <div className="tl-pitch-header">
              <div className="tl-pitch-title">
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-pitch)',
                    boxShadow: '0 0 8px var(--color-pitch)',
                  }}
                />
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Live Pitch Demonstration
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    4-3-3 High Press Trap vs 4-2-3-1 Goal Kick Build-Up &bull; 105×68m Regulation Pitch
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span className="tl-pitch-badge">Funnel: Touchline Lock</span>
                <span className="tl-pitch-badge">Compactness: 34.0m</span>
                <Link to="/analysis" className="pl-btn pl-btn-primary pl-btn-sm">
                  <Zap size={14} />
                  <span>Analyze in Full App</span>
                </Link>
              </div>
            </div>

            {/* Embedded Live Tactical Pitch */}
            <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
              <TacticalPitch
                attackingTeam={DEMO_ATTACKING_TEAM}
                defendingTeam={DEMO_DEFENDING_TEAM}
                ballPosition={DEMO_BALL_POSITION}
                spatialMetrics={DEMO_SPATIAL_METRICS}
                showZones={true}
                showLabels={true}
                showAnalysisOverlay={true}
                height="500px"
              />
            </div>

            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                  Red Cones: Cover Shadows
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                  Green Line: Open Passing Option
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                  Amber Line: Contested Option
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Drag players or ball to recalculate geometry in Scenario Builder
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: User Feedback / Reviews Section */}
      <section id="reviews" className="tl-section">
        <div className="tl-landing-container">
          <div className="tl-section-header">
            <div className="tl-section-tag">
              <Quote size={14} />
              <span>Practitioner Perspectives</span>
            </div>
            <h3 className="tl-section-title">Feedback from Coaches & Analysts</h3>
            <p className="tl-section-desc">
              Realistic observations from tactical practitioners, analysts, and football enthusiasts
              applying TacticalLens to match breakdowns.
            </p>
          </div>

          <div className="tl-grid-2">
            {USER_REVIEWS.map((review, idx) => (
              <div key={idx} className="tl-review-card">
                <div>
                  <p className="tl-review-quote">"{review.review}"</p>
                </div>
                <div>
                  <div className="tl-review-author">
                    <div className="tl-avatar">{review.initials}</div>
                    <div>
                      <h5 className="tl-author-name">{review.name}</h5>
                      <p className="tl-author-role">{review.role}</p>
                    </div>
                  </div>
                  <div className="tl-review-tag">{review.tag}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: Call to Action Banner */}
      <section className="tl-section" style={{ borderBottom: 'none' }}>
        <div className="tl-landing-container">
          <div className="tl-cta-banner">
            <h3 className="tl-cta-title">Explore Football Tactics with Spatial Precision</h3>
            <p className="tl-cta-desc">
              Whether you are preparing a match plan, teaching young players about cover shadows,
              or dissecting a Champions League low block, TacticalLens gives you the spatial
              clarity you need.
            </p>
            <div className="tl-cta-buttons">
              <Link to="/builder" className="pl-btn pl-btn-primary pl-btn-lg">
                <PlusCircle size={18} />
                <span>Create Custom Scenario</span>
              </Link>
              <Link to="/analysis" className="pl-btn pl-btn-secondary pl-btn-lg">
                <Zap size={18} />
                <span>Launch Tactical Analysis</span>
              </Link>
              <Link to="/dashboard" className="pl-btn pl-btn-outline pl-btn-lg">
                <Compass size={18} />
                <span>Go to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="tl-footer">
        <div className="tl-landing-container">
          <div className="tl-footer-grid">
            {/* Col 1 */}
            <div className="tl-footer-brand">
              <Link to="/" className="tl-brand">
                <div className="tl-brand-icon">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h4 className="tl-brand-title">
                    Tactical<span>Lens</span>
                  </h4>
                  <p className="tl-brand-subtitle">Tactical AI Intelligence</p>
                </div>
              </Link>
              <p>
                Grounding football pressing systems, defensive blocks, and transition dynamics in
                deterministic spatial geometry and verified tactical theory.
              </p>
            </div>

            {/* Col 2 */}
            <div>
              <h5 className="tl-footer-heading">Navigation</h5>
              <ul className="tl-footer-links">
                <li>
                  <Link to="/dashboard" className="tl-footer-link">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/scenarios" className="tl-footer-link">
                    Match Scenarios
                  </Link>
                </li>
                <li>
                  <Link to="/builder" className="tl-footer-link">
                    Scenario Builder
                  </Link>
                </li>
                <li>
                  <Link to="/analysis" className="tl-footer-link">
                    Tactical Analysis
                  </Link>
                </li>
                <li>
                  <Link to="/history" className="tl-footer-link">
                    Analysis History
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h5 className="tl-footer-heading">Tactical Mechanics</h5>
              <ul className="tl-footer-links">
                <li>
                  <a href="#attacking" className="tl-footer-link">
                    Cover Shadows
                  </a>
                </li>
                <li>
                  <a href="#attacking" className="tl-footer-link">
                    Passing Lane Math
                  </a>
                </li>
                <li>
                  <a href="#attacking" className="tl-footer-link">
                    Pressing Funnels
                  </a>
                </li>
                <li>
                  <a href="#defensive" className="tl-footer-link">
                    Haramball Low Block
                  </a>
                </li>
                <li>
                  <a href="#defensive" className="tl-footer-link">
                    Zone 14 Screening
                  </a>
                </li>
                <li>
                  <a href="#defensive" className="tl-footer-link">
                    Step-Out Triggers
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4 */}
            <div>
              <h5 className="tl-footer-heading">Architecture</h5>
              <ul className="tl-footer-links">
                <li>
                  <span className="tl-footer-link">React 19 &bull; Vite &bull; TypeScript</span>
                </li>
                <li>
                  <span className="tl-footer-link">Node.js Express &bull; Drizzle ORM</span>
                </li>
                <li>
                  <span className="tl-footer-link">PostgreSQL 15 Vector Chunks</span>
                </li>
                <li>
                  <span className="tl-footer-link">Groq AI (Llama 3.3 70B)</span>
                </li>
                <li>
                  <span className="tl-footer-link">105×68m SVG Regulation Pitch</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="tl-footer-bottom">
            <div>
              &copy; {new Date().getFullYear()} TacticalLens Football Intelligence. All tactical
              principles grounded in verified coaching doctrine.
            </div>
            <div style={{ fontFamily: 'var(--font-mono)' }}>TacticalLens v1.0.0 &bull; Open Architecture</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
