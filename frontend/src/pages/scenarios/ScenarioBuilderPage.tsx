import { type FC, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Copy,
  Edit3,
  Info,
  RotateCcw,
  Save,
  Sparkles,
  Zap,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CustomSelect,
  EmptyState,
  Input,
  LoadingSpinner,
} from '../../components/common/index.ts'
import { PlayerInspector, TacticalPitch } from '../../components/pitch/index.ts'
import { useApiMutation, useApiQuery } from '../../hooks/useApi.ts'
import { scenarioService } from '../../api/services/scenarios.ts'
import type {
  BallPosition,
  MatchContext,
  MatchPhase,
  Player,
  Scenario,
  ScenarioCreatePayload,
  TeamTacticalSetup,
} from '../../types/scenario.ts'
import {
  AVAILABLE_FORMATIONS,
  type FormationPreset,
  createDefaultTeamSetup,
} from '../../utils/formations.ts'
import { clamp, getPitchZone } from '../../utils/zones.ts'

const MATCH_PHASE_OPTIONS = [
  {
    value: 'high_press',
    label: 'High Press (Final Third Possession Win)',
    description: 'Aggressive press forcing turnovers in opposition build-up third',
  },
  {
    value: 'counter_press',
    label: 'Counter-Press (Immediate 5-Second Transition)',
    description: 'Immediate Gegenpressing collapse upon turnover',
  },
  {
    value: 'mid_block',
    label: 'Mid-Block (Compact Zonal Corridor Trap)',
    description: 'Denying progression through midfield central pockets & half-spaces',
  },
  {
    value: 'low_block',
    label: 'Low-Block (Deep Penalty Box Shield & Haramball)',
    description: 'Ultra-compact defensive lines shielding the penalty box',
  },
  {
    value: 'defensive_transition',
    label: 'Defensive Transition (Rest Defense Recovery)',
    description: 'Recovery runs and rest-defense organization behind the ball',
  },
]

const COMPETITION_OPTIONS = [
  { value: 'Premier League', label: 'Premier League' },
  { value: 'UEFA Champions League', label: 'UEFA Champions League' },
  { value: 'La Liga & Copa del Rey', label: 'La Liga & Copa del Rey' },
  { value: 'Serie A & Coppa Italia', label: 'Serie A & Coppa Italia' },
  { value: 'Bundesliga', label: 'Bundesliga' },
  { value: 'International & World Cup', label: 'International & World Cup' },
  { value: 'Tactical Simulation & Training', label: 'Tactical Simulation & Training' },
]

interface ScenarioBuilderFormProps {
  initialScenario?: Scenario | null
  editScenarioId?: string | null
}

const ScenarioBuilderForm: FC<ScenarioBuilderFormProps> = ({
  initialScenario,
  editScenarioId,
}) => {
  const navigate = useNavigate()
  const isEditMode = Boolean(editScenarioId && initialScenario)

  // Form State
  const [title, setTitle] = useState<string>(() => initialScenario?.title ?? 'Custom Pressing Setup')
  const [description, setDescription] = useState<string>(
    () => initialScenario?.description ?? 'Coordinated pressing block trapping opponent build-up in wide half-spaces.',
  )
  const [matchPhase, setMatchPhase] = useState<MatchPhase>(
    () => (initialScenario?.match_phase as MatchPhase) ?? 'high_press',
  )
  const [tacticalSituation, setTacticalSituation] = useState<string>(
    () => initialScenario?.tactical_situation ?? 'Opponent Build-Up from Deep Defensive Third',
  )

  // Team Setups: STRICT SPATIAL INTEGRITY
  // Preserves exact player (x, y) coordinates, squad numbers, roles, and names verbatim
  const [attackingTeam, setAttackingTeam] = useState<TeamTacticalSetup>(() =>
    initialScenario?.attacking_team ?? createDefaultTeamSetup('attacking', '4-3-3', 'Brighton & Hove Albion (Build-up)'),
  )
  const [defendingTeam, setDefendingTeam] = useState<TeamTacticalSetup>(() =>
    initialScenario?.defending_team ?? createDefaultTeamSetup('defending', '4-3-3', 'Liverpool (High Press)'),
  )

  // Ball & Match Context
  const [ballPosition, setBallPosition] = useState<BallPosition>(() =>
    initialScenario?.ball_position ?? {
      x: 18.0,
      y: 46.0,
      z: 0.0,
      zone: getPitchZone(18.0, 46.0),
    },
  )

  const [matchContext, setMatchContext] = useState<MatchContext>(() =>
    initialScenario?.match_context ?? {
      minute: 24,
      score: '0-0',
      competition: 'Premier League',
      pitch_dimensions: { length: 105.0, width: 68.0 },
    },
  )

  // Selected Player for Pitch Inspection & Manipulation
  const [selectedPlayer, setSelectedPlayer] = useState<{
    player: Player
    team: 'attacking' | 'defending'
  } | null>(null)

  const [activeTab, setActiveTab] = useState<'basic' | 'attacking' | 'defending' | 'context'>('basic')
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const handleResetToOriginal = () => {
    if (!initialScenario) return
    setTitle(initialScenario.title)
    setDescription(initialScenario.description ?? '')
    setMatchPhase(initialScenario.match_phase as MatchPhase)
    setTacticalSituation(initialScenario.tactical_situation)
    setAttackingTeam(initialScenario.attacking_team)
    setDefendingTeam(initialScenario.defending_team)
    setBallPosition(initialScenario.ball_position)
    if (initialScenario.match_context) {
      setMatchContext(initialScenario.match_context)
    }
    setSelectedPlayer(null)
    setValidationErrors([])
  }

  // API Mutations
  const { mutate: submitScenario, isLoading: isCreating, error: createError } = useApiMutation(
    (payload: ScenarioCreatePayload) => scenarioService.createScenario(payload),
  )

  const { mutate: updateScenarioMutation, isLoading: isUpdating, error: updateError } = useApiMutation(
    ({ id, payload }: { id: string; payload: ScenarioCreatePayload }) =>
      scenarioService.updateScenario(id, payload),
  )

  const isSubmitting = isCreating || isUpdating
  const submitError = createError || updateError

  // Update Player Position from Pitch drag or click
  const handleUpdatePlayerPosition = (
    playerId: string,
    team: 'attacking' | 'defending',
    coords: { x: number; y: number },
  ) => {
    const clampedPos = {
      x: clamp(coords.x, 0, 105),
      y: clamp(coords.y, 0, 68),
    }

    if (team === 'attacking') {
      setAttackingTeam((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === playerId ? { ...p, position: clampedPos } : p,
        ),
      }))
    } else {
      setDefendingTeam((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === playerId ? { ...p, position: clampedPos } : p,
        ),
      }))
    }

    // Keep inspector updated
    if (selectedPlayer && selectedPlayer.player.id === playerId) {
      setSelectedPlayer({
        ...selectedPlayer,
        player: { ...selectedPlayer.player, position: clampedPos },
      })
    }
  }

  // Update entire player state (name, number, role, position)
  const handleUpdatePlayer = (
    updatedPlayer: Player,
    team: 'attacking' | 'defending',
  ) => {
    if (team === 'attacking') {
      setAttackingTeam((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === updatedPlayer.id ? updatedPlayer : p,
        ),
      }))
    } else {
      setDefendingTeam((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === updatedPlayer.id ? updatedPlayer : p,
        ),
      }))
    }

    if (selectedPlayer && selectedPlayer.player.id === updatedPlayer.id) {
      setSelectedPlayer({
        team,
        player: updatedPlayer,
      })
    }
  }

  // Update Ball Position
  const handleUpdateBallPosition = (coords: { x: number; y: number }) => {
    const clampedPos = {
      x: clamp(coords.x, 0, 105),
      y: clamp(coords.y, 0, 68),
    }
    const zone = getPitchZone(clampedPos.x, clampedPos.y)
    setBallPosition((prev) => ({
      ...prev,
      ...clampedPos,
      zone,
    }))
  }

  // Change Formation and Auto-Populate Player Coordinates
  const handleFormationChange = (team: 'attacking' | 'defending', formation: FormationPreset) => {
    if (team === 'attacking') {
      const newSetup = createDefaultTeamSetup('attacking', formation, attackingTeam.name, attackingTeam.players)
      setAttackingTeam(newSetup)
    } else {
      const newSetup = createDefaultTeamSetup('defending', formation, defendingTeam.name, defendingTeam.players)
      setDefendingTeam(newSetup)
    }
    setSelectedPlayer(null)
  }

  // Validate and Submit (Supports in-place Update, Save as New Copy, or Save & Analyze)
  const handleSaveScenario = async (options: {
    mode: 'update' | 'create_new'
    andAnalyze?: boolean
  }) => {
    const errors: string[] = []
    if (title.trim().length < 3) errors.push('Title must be at least 3 characters.')
    if (tacticalSituation.trim().length < 3) errors.push('Tactical situation is required.')
    if (!attackingTeam.name.trim()) errors.push('Attacking team name is required.')
    if (!defendingTeam.name.trim()) errors.push('Defending team name is required.')
    if (attackingTeam.players.length < 1) errors.push('Attacking team must have at least 1 player.')
    if (defendingTeam.players.length < 1) errors.push('Defending team must have at least 1 player.')

    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    setValidationErrors([])

    let targetTitle = title.trim()
    if (options.mode === 'create_new' && isEditMode) {
      if (initialScenario && initialScenario.title === targetTitle && !targetTitle.includes('(Copy)')) {
        targetTitle = `${targetTitle} (Copy)`
      }
    }

    const payload: ScenarioCreatePayload = {
      title: targetTitle,
      description: description.trim() || undefined,
      match_phase: matchPhase,
      tactical_situation: tacticalSituation.trim(),
      attacking_team: attackingTeam,
      defending_team: defendingTeam,
      ball_position: ballPosition,
      match_context: matchContext,
    }

    try {
      if (options.mode === 'update' && editScenarioId) {
        const updated = await updateScenarioMutation({ id: editScenarioId, payload })
        if (options.andAnalyze) {
          navigate(`/analysis?scenario_id=${updated.id}`)
        } else {
          navigate(`/scenarios/${updated.id}`)
        }
      } else {
        const created = await submitScenario(payload)
        if (options.andAnalyze) {
          navigate(`/analysis?scenario_id=${created.id}`)
        } else {
          navigate(`/scenarios/${created.id}`)
        }
      }
    } catch {
      // Error handled by mutation state
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link to={isEditMode && editScenarioId ? `/scenarios/${editScenarioId}` : '/scenarios'}>
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />}>
              {isEditMode ? 'Back to Scenario' : 'Back to Scenarios'}
            </Button>
          </Link>
          <Badge
            variant={isEditMode ? 'tactical' : 'pitch'}
            icon={isEditMode ? <Edit3 size={12} /> : <Sparkles size={12} />}
          >
            {isEditMode ? 'Scenario Rebuild & Edit Studio' : 'Interactive Scenario Studio'}
          </Badge>
          {isEditMode && initialScenario && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Rebuilding: <strong style={{ color: 'var(--text-primary)' }}>{initialScenario.title}</strong>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {isEditMode ? (
            <>
              {initialScenario && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<RotateCcw size={14} />}
                  onClick={handleResetToOriginal}
                  title="Discard unsaved changes and restore original coordinates"
                  disabled={isSubmitting}
                >
                  Reset
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                icon={<Copy size={14} />}
                onClick={() => void handleSaveScenario({ mode: 'create_new' })}
                isLoading={isCreating}
                disabled={isSubmitting}
                title="Save as a new scenario copy without modifying the original"
              >
                Save as New Copy
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Save size={15} />}
                onClick={() => void handleSaveScenario({ mode: 'update' })}
                isLoading={isUpdating}
                disabled={isSubmitting}
                title="Update and overwrite the existing scenario in-place"
              >
                Update Scenario
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Zap size={14} />}
                onClick={() => void handleSaveScenario({ mode: 'update', andAnalyze: true })}
                isLoading={isUpdating}
                disabled={isSubmitting}
                title="Save changes and immediately launch AI tactical analysis"
              >
                Update & Analyze
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={<Zap size={14} />}
                onClick={() => void handleSaveScenario({ mode: 'create_new', andAnalyze: true })}
                isLoading={isCreating}
                disabled={isSubmitting}
                title="Save scenario and immediately launch AI tactical analysis"
              >
                Save & Analyze
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Save size={15} />}
                onClick={() => void handleSaveScenario({ mode: 'create_new' })}
                isLoading={isCreating}
                disabled={isSubmitting}
              >
                Save Tactical Scenario
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Edit Mode Notice Banner */}
      {isEditMode && initialScenario && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Edit3 size={18} color="var(--color-tactical)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Editing Scenario & Coordinates:</strong> All 22 player positions, custom names, roles, and ball coordinates are loaded exactly as saved. Modifying player positions on the pitch updates their coordinates while preserving team structures.
            </div>
          </div>
          <Link to="/builder">
            <Button variant="ghost" size="sm">
              New Blank Scenario
            </Button>
          </Link>
        </div>
      )}

      {/* Errors Banner */}
      {(validationErrors.length > 0 || submitError) && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--color-danger)',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '6px' }}>Please resolve the following issues:</div>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            {validationErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
            {submitError && <li>{submitError.message}</li>}
          </ul>
        </div>
      )}

      {/* Main Studio Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(360px, 1fr)',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Interactive Pitch */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TacticalPitch
            attackingTeam={attackingTeam}
            defendingTeam={defendingTeam}
            ballPosition={ballPosition}
            selectedPlayerId={selectedPlayer?.player.id}
            onSelectPlayer={(p, team) => {
              if (!p) {
                setSelectedPlayer(null)
              } else if (selectedPlayer?.player.id === p.id) {
                setSelectedPlayer(null)
              } else {
                setSelectedPlayer({ player: p, team: team || 'attacking' })
              }
            }}
            onDeselectPlayer={() => setSelectedPlayer(null)}
            editable
            onUpdatePlayerPosition={handleUpdatePlayerPosition}
            onUpdateBallPosition={handleUpdateBallPosition}
            height="580px"
            showZones
          />

          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Info size={16} color="var(--color-pitch)" />
            <span>
              <strong>Tip:</strong> Drag to reposition players. Click a player to select/deselect, click empty pitch or press <code>Esc</code> to deselect.
            </span>
          </div>
        </div>

        {/* Right Column: Inspector & Form Configuration Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Player Inspector in Editable Mode */}
          <PlayerInspector
            player={selectedPlayer?.player || null}
            team={selectedPlayer?.team || null}
            teamName={
              selectedPlayer?.team === 'attacking' ? attackingTeam.name : defendingTeam.name
            }
            editable
            onClose={() => setSelectedPlayer(null)}
            onUpdatePlayer={(upd) => {
              if (!selectedPlayer) return
              handleUpdatePlayer(upd, selectedPlayer.team)
            }}
          />

          {/* Form Tabs */}
          <Card>
            <CardHeader style={{ padding: '12px 16px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <Button
                variant={activeTab === 'basic' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('basic')}
              >
                Metadata
              </Button>
              <Button
                variant={activeTab === 'attacking' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('attacking')}
              >
                Attacking Team
              </Button>
              <Button
                variant={activeTab === 'defending' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('defending')}
              >
                Defending Team
              </Button>
              <Button
                variant={activeTab === 'context' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('context')}
              >
                Match & Ball
              </Button>
            </CardHeader>

            <CardContent style={{ padding: '20px' }}>
              {/* Tab 1: Basic Scenario Information */}
              {activeTab === 'basic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <Input
                    label="Scenario Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Manchester City 3-2 Rest Defense Counter-Press"
                  />

                  <Input
                    label="Tactical Situation"
                    value={tacticalSituation}
                    onChange={(e) => setTacticalSituation(e.target.value)}
                    placeholder="e.g. Turnover in central Zone 14 leading to immediate press"
                  />

                  <CustomSelect
                    label="Match Phase"
                    value={matchPhase}
                    onChange={(val) => setMatchPhase(val as MatchPhase)}
                    options={MATCH_PHASE_OPTIONS}
                  />

                  <div className="pl-field-group">
                    <label className="pl-label">Tactical Narrative (Description)</label>
                    <textarea
                      className="pl-input"
                      style={{ height: '80px', resize: 'vertical' }}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the pressing triggers, passing traps, and defensive shape..."
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Attacking Team Configuration */}
              {activeTab === 'attacking' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <Input
                    label="Attacking Team Name"
                    value={attackingTeam.name}
                    onChange={(e) =>
                      setAttackingTeam((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />

                  <CustomSelect
                    label="Formation Preset"
                    value={attackingTeam.formation}
                    onChange={(val) =>
                      handleFormationChange('attacking', val as FormationPreset)
                    }
                    options={AVAILABLE_FORMATIONS.map((f) => ({
                      value: f.id,
                      label: f.name,
                    }))}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Attacking Squad ({attackingTeam.players.length} Players)
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Edit names directly &bull; Click to inspect
                      </span>
                    </div>

                    <div
                      style={{
                        maxHeight: '220px',
                        overflowY: 'auto',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-canvas)',
                        padding: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'var(--border-strong) transparent',
                      }}
                    >
                      {attackingTeam.players.map((p) => {
                        const isSelected = selectedPlayer?.player.id === p.id
                        return (
                          <div
                            key={p.id}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '32px 52px 1fr 64px',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '4px 8px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                              border: isSelected ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                fontSize: '0.8125rem',
                                color: '#38bdf8',
                                textAlign: 'center',
                              }}
                            >
                              #{p.number}
                            </span>
                            <Badge variant="tactical" size="sm" style={{ padding: '2px 4px', fontSize: '0.6875rem', textAlign: 'center' }}>
                              {p.role}
                            </Badge>
                            <input
                              className="pl-input"
                              style={{ height: '30px', padding: '4px 8px', fontSize: '0.8125rem' }}
                              value={p.name}
                              onChange={(e) =>
                                handleUpdatePlayer({ ...p, name: e.target.value }, 'attacking')
                              }
                              onFocus={() => setSelectedPlayer({ player: p, team: 'attacking' })}
                              placeholder="Player Name"
                            />
                            <Button
                              variant={isSelected ? 'secondary' : 'ghost'}
                              size="sm"
                              style={{ height: '26px', padding: '2px 6px', fontSize: '0.6875rem' }}
                              onClick={() => setSelectedPlayer(isSelected ? null : { player: p, team: 'attacking' })}
                            >
                              {isSelected ? 'Active' : 'Select'}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Defending Team Configuration */}
              {activeTab === 'defending' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <Input
                    label="Defending Team Name"
                    value={defendingTeam.name}
                    onChange={(e) =>
                      setDefendingTeam((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />

                  <CustomSelect
                    label="Formation Preset"
                    value={defendingTeam.formation}
                    onChange={(val) =>
                      handleFormationChange('defending', val as FormationPreset)
                    }
                    options={AVAILABLE_FORMATIONS.map((f) => ({
                      value: f.id,
                      label: f.name,
                    }))}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Defending Squad ({defendingTeam.players.length} Players)
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Edit names directly &bull; Click to inspect
                      </span>
                    </div>

                    <div
                      style={{
                        maxHeight: '220px',
                        overflowY: 'auto',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-canvas)',
                        padding: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'var(--border-strong) transparent',
                      }}
                    >
                      {defendingTeam.players.map((p) => {
                        const isSelected = selectedPlayer?.player.id === p.id
                        return (
                          <div
                            key={p.id}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '32px 52px 1fr 64px',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '4px 8px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                              border: isSelected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                fontSize: '0.8125rem',
                                color: '#10b981',
                                textAlign: 'center',
                              }}
                            >
                              #{p.number}
                            </span>
                            <Badge variant="pitch" size="sm" style={{ padding: '2px 4px', fontSize: '0.6875rem', textAlign: 'center' }}>
                              {p.role}
                            </Badge>
                            <input
                              className="pl-input"
                              style={{ height: '30px', padding: '4px 8px', fontSize: '0.8125rem' }}
                              value={p.name}
                              onChange={(e) =>
                                handleUpdatePlayer({ ...p, name: e.target.value }, 'defending')
                              }
                              onFocus={() => setSelectedPlayer({ player: p, team: 'defending' })}
                              placeholder="Player Name"
                            />
                            <Button
                              variant={isSelected ? 'secondary' : 'ghost'}
                              size="sm"
                              style={{ height: '26px', padding: '2px 6px', fontSize: '0.6875rem' }}
                              onClick={() => setSelectedPlayer(isSelected ? null : { player: p, team: 'defending' })}
                            >
                              {isSelected ? 'Active' : 'Select'}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Match Context & Ball Coordinates */}
              {activeTab === 'context' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <Input
                      label="Match Minute"
                      type="number"
                      min={0}
                      max={120}
                      value={matchContext.minute ?? 0}
                      onChange={(e) =>
                        setMatchContext((prev) => ({
                          ...prev,
                          minute: parseInt(e.target.value, 10) || 0,
                        }))
                      }
                    />
                    <Input
                      label="Score"
                      value={matchContext.score || '0-0'}
                      onChange={(e) =>
                        setMatchContext((prev) => ({ ...prev, score: e.target.value }))
                      }
                    />
                  </div>

                  <CustomSelect
                    label="Competition Preset"
                    value={
                      COMPETITION_OPTIONS.some((opt) => opt.value === matchContext.competition)
                        ? (matchContext.competition ?? '')
                        : 'Tactical Simulation & Training'
                    }
                    onChange={(val) => {
                      setMatchContext((prev) => ({ ...prev, competition: val }))
                    }}
                    options={COMPETITION_OPTIONS}
                  />

                  <Input
                    label="Competition Name"
                    value={matchContext.competition || ''}
                    onChange={(e) =>
                      setMatchContext((prev) => ({ ...prev, competition: e.target.value }))
                    }
                    placeholder="e.g. Premier League or Friendly"
                  />

                  {/* Ball Coordinates */}
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      Ball Location & Zone
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-pitch-light)' }}>
                      {ballPosition.zone}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <Input
                        label="Ball X (0-105m)"
                        type="number"
                        step={0.5}
                        value={ballPosition.x}
                        onChange={(e) => handleUpdateBallPosition({ x: parseFloat(e.target.value) || 0, y: ballPosition.y })}
                      />
                      <Input
                        label="Ball Y (0-68m)"
                        type="number"
                        step={0.5}
                        value={ballPosition.y}
                        onChange={(e) => handleUpdateBallPosition({ x: ballPosition.x, y: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export const ScenarioBuilderPage: FC = () => {
  const { id: routeScenarioId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const editScenarioId = routeScenarioId || searchParams.get('edit_id') || searchParams.get('scenario_id') || null

  const {
    data: existingScenario,
    isLoading: isLoadingExisting,
    error: loadExistingError,
    refetch: refetchExisting,
  } = useApiQuery(
    () => (editScenarioId ? scenarioService.getScenarioById(editScenarioId) : Promise.resolve(null)),
    [editScenarioId],
    { enabled: Boolean(editScenarioId) },
  )

  if (editScenarioId && isLoadingExisting && !existingScenario) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '96px 0', gap: '16px' }}>
        <LoadingSpinner size="lg" />
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', fontWeight: 500 }}>
          Loading pitch scenario coordinates and tactical setup for editing...
        </div>
      </div>
    )
  }

  if (editScenarioId && loadExistingError && !existingScenario) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Link to="/scenarios">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />}>
            Back to Scenarios
          </Button>
        </Link>
        <EmptyState
          icon={<Info size={28} />}
          title="Could Not Load Scenario for Editing"
          description={loadExistingError.message || `No scenario with ID ${editScenarioId} was found.`}
          action={
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="secondary" onClick={() => void refetchExisting()}>
                Retry
              </Button>
              <Link to="/builder">
                <Button variant="primary">Start Clean Scenario</Button>
              </Link>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <ScenarioBuilderForm
      key={existingScenario ? existingScenario.id : 'clean-scenario-builder'}
      initialScenario={existingScenario}
      editScenarioId={editScenarioId}
    />
  )
}
