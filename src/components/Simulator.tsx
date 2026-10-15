import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GROUP_TOY, GROUP_2048, GroupParams } from '../crypto/params';
import { ProtocolParty, ProtocolMessage, runFullProtocol } from '../crypto/protocol';
import { generateAuthKeyPair, PartyKeyPair } from '../crypto/auth';
import { EveSessionResult, simulateEve } from '../crypto/eve';
import { PartyCard } from './PartyCard';
import { Channel } from './Channel';
import { SimulatorControls } from './SimulatorControls';
import { StatusBar } from './StatusBar';
import { EvePanel } from './EvePanel';

export const Simulator: React.FC = () => {
  // Configuration State
  const [currentGroup, setCurrentGroup] = useState<GroupParams>(GROUP_TOY);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [eveActive, setEveActive] = useState<boolean>(false);

  // Auth KeyPairs (pinned)
  const [aliceKeyPair, setAliceKeyPair] = useState<PartyKeyPair | null>(null);
  const [bobKeyPair, setBobKeyPair] = useState<PartyKeyPair | null>(null);

  // Simulation execution state
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isFullSizeRunning, setIsFullSizeRunning] = useState<boolean>(false);
  const [executionDurationMs, setExecutionDurationMs] = useState<number | undefined>(undefined);

  // Active protocol parties
  const [alice, setAlice] = useState<ProtocolParty | null>(null);
  const [bob, setBob] = useState<ProtocolParty | null>(null);
  const [messages, setMessages] = useState<ProtocolMessage[]>([]);

  // Eve MITM attack result
  const [eveResult, setEveResult] = useState<EveSessionResult | null>(null);

  // Key derivation & confirmation status
  const [sessionKeyHex, setSessionKeyHex] = useState<string | undefined>(undefined);
  const [keysMatch, setKeysMatch] = useState<boolean | undefined>(undefined);
  const [validationPassed, setValidationPassed] = useState<boolean>(true);

  // Reference for auto-play interval
  const timerRef = useRef<number | null>(null);

  // Initialize Keypairs on startup
  useEffect(() => {
    async function initKeys() {
      const aKeys = await generateAuthKeyPair();
      const bKeys = await generateAuthKeyPair();
      setAliceKeyPair(aKeys);
      setBobKeyPair(bKeys);
    }
    initKeys();
  }, []);

  // Initialize/Reset parties and prepare all 6 messages
  const initializeSession = useCallback(
    async (group: GroupParams, isAuth: boolean, isEve: boolean) => {
      const sessionId = 'session_' + Math.random().toString(36).substring(2, 9);

      const pA = new ProtocolParty(
        'Alice',
        group,
        sessionId,
        isAuth,
        aliceKeyPair ?? undefined,
        bobKeyPair?.keyPair.publicKey
      );

      const pB = new ProtocolParty(
        'Bob',
        group,
        sessionId,
        isAuth,
        bobKeyPair ?? undefined,
        aliceKeyPair?.keyPair.publicKey
      );

      setAlice(pA);
      setBob(pB);
      setCurrentStep(0);
      setIsPlaying(false);
      setSessionKeyHex(undefined);
      setKeysMatch(undefined);
      setValidationPassed(true);

      if (isEve) {
        // Run Eve attack simulation
        const eveRes = await simulateEve(group, isAuth, aliceKeyPair ?? undefined, bobKeyPair ?? undefined);
        setEveResult(eveRes);
        setMessages(eveRes.interceptedMessages);
      } else {
        setEveResult(null);
        // Pre-compute normal 6 messages for step-by-step playback
        try {
          const m1 = await pA.createM1();
          const m2 = await pB.createM2();
          const m3 = await pB.processM1AndCreateM3(m1);
          const m4 = await pA.processM2AndCreateM4(m2);
          const m5 = await pA.processM3AndCreateM5(m3);
          const m6 = await pB.processM4AndCreateM6(m4);

          setMessages([m1, m2, m3, m4, m5, m6]);
        } catch {
          setValidationPassed(false);
        }
      }
    },
    [aliceKeyPair, bobKeyPair]
  );

  // Reset when group, auth, or eve changes
  useEffect(() => {
    if (aliceKeyPair && bobKeyPair) {
      initializeSession(currentGroup, authenticated, eveActive);
    }
  }, [currentGroup, authenticated, eveActive, aliceKeyPair, bobKeyPair, initializeSession]);

  // Handle advancing a single step
  const handleStep = useCallback(async () => {
    if (!alice || !bob || currentStep >= messages.length) return;

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    // If step reaches completion (all 6 messages exchanged)
    if (nextStep === 6 && !eveActive) {
      try {
        const msgValues = messages.map((m) => m.value);

        // Recover secrets
        await bob.processM5AndRecoverKA(messages[4]);
        await alice.processM6AndRecoverKB(messages[5]);

        // Derive keys
        const skA = await alice.finalizeKey(msgValues);
        const skB = await bob.finalizeKey(msgValues);

        // Verify tags
        const aliceOk = await alice.verifyPeerConfirmationTag(bob.confirmationTagSent!);
        const bobOk = await bob.verifyPeerConfirmationTag(alice.confirmationTagSent!);

        setSessionKeyHex(skA);
        setKeysMatch(aliceOk && bobOk && skA === skB);
        setValidationPassed(true);
      } catch {
        setValidationPassed(false);
        setKeysMatch(false);
      }
    } else if (nextStep === 6 && eveActive) {
      if (authenticated) {
        setKeysMatch(false);
        setValidationPassed(true);
      } else {
        setSessionKeyHex(alice.sessionKeyHex);
        setKeysMatch(false); // Alice's key != Bob's key
      }
    }
  }, [alice, bob, currentStep, messages, eveActive, authenticated]);

  // Auto-play interval
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < messages.length) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 800);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, messages.length]);

  // Trigger completion updates if auto-play hits step 6
  useEffect(() => {
    if (currentStep === 6 && !sessionKeyHex && !eveActive && alice && bob) {
      (async () => {
        try {
          const msgValues = messages.map((m) => m.value);
          await bob.processM5AndRecoverKA(messages[4]);
          await alice.processM6AndRecoverKB(messages[5]);
          const skA = await alice.finalizeKey(msgValues);
          const skB = await bob.finalizeKey(msgValues);
          const aliceOk = await alice.verifyPeerConfirmationTag(bob.confirmationTagSent!);
          const bobOk = await bob.verifyPeerConfirmationTag(alice.confirmationTagSent!);
          setSessionKeyHex(skA);
          setKeysMatch(aliceOk && bobOk && skA === skB);
        } catch {
          setValidationPassed(false);
        }
      })();
    }
  }, [currentStep, sessionKeyHex, eveActive, alice, bob, messages]);

  // Run full-size 2048-bit benchmark
  const handleRunFullSize = async () => {
    setIsFullSizeRunning(true);
    setIsPlaying(false);
    try {
      const res = await runFullProtocol(
        GROUP_2048,
        authenticated,
        aliceKeyPair ?? undefined,
        bobKeyPair ?? undefined
      );

      setCurrentGroup(GROUP_2048);
      setAlice(res.alice);
      setBob(res.bob);
      setMessages(res.messages);
      setCurrentStep(6);
      setSessionKeyHex(res.alice.sessionKeyHex);
      setKeysMatch(res.success);
      setExecutionDurationMs(res.durationMs);
      setValidationPassed(true);
    } catch {
      setValidationPassed(false);
      setKeysMatch(false);
    } finally {
      setIsFullSizeRunning(false);
    }
  };

  // Compute active round number based on current step
  const getRoundNumber = () => {
    if (currentStep === 0) return 0;
    if (currentStep <= 2) return 1;
    if (currentStep <= 4) return 2;
    return 3;
  };

  // Determine who is currently active sender / receiver
  const activeMessage = currentStep > 0 && currentStep <= messages.length ? messages[currentStep - 1] : null;
  const isAliceSender = activeMessage?.from === 'Alice';
  const isBobSender = activeMessage?.from === 'Bob';
  const isAliceReceiver = activeMessage?.to === 'Alice';
  const isBobReceiver = activeMessage?.to === 'Bob';

  return (
    <section id="simulator" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="mb-8 text-center">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Interactive Key Exchange Simulator
        </h2>
        <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Simulated Three-Pass Protocol Execution
        </p>
        <p className="mx-auto mt-2 max-w-xl text-xs text-muted sm:text-sm">
          Follow Alice and Bob as they exchange and unblind homomorphically masked secrets across 3 rounds.
        </p>
      </div>

      {/* Simulator Controls */}
      <SimulatorControls
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onStep={handleStep}
        onReset={() => initializeSession(currentGroup, authenticated, eveActive)}
        onNewSecrets={() => initializeSession(currentGroup, authenticated, eveActive)}
        onRunFullSize={handleRunFullSize}
        isFullSizeRunning={isFullSizeRunning}
        is2048Bit={currentGroup.id === 'rfc3526_2048'}
        onToggleGroupSize={() =>
          setCurrentGroup((prev) => (prev.id === 'toy' ? GROUP_2048 : GROUP_TOY))
        }
        authenticated={authenticated}
        onToggleAuthenticated={() => setAuthenticated(!authenticated)}
        eveActive={eveActive}
        onToggleEve={() => setEveActive(!eveActive)}
        canStep={currentStep < messages.length}
      />

      {/* 3-Column Core Grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Alice */}
        <div className="lg:col-span-3">
          {alice ? (
            <PartyCard
              role="Alice"
              secrets={alice.secrets}
              authenticated={authenticated}
              fingerprint={aliceKeyPair?.fingerprint}
              sessionKeyHex={alice.sessionKeyHex}
              confirmationValid={alice.confirmationValid}
              isActiveSender={isAliceSender}
              isActiveReceiver={isAliceReceiver}
              groupByteLength={currentGroup.byteLength}
            />
          ) : (
            <div className="h-64 rounded-card border border-card-border bg-card p-6" />
          )}
        </div>

        {/* Center Column: Public Channel */}
        <div className="lg:col-span-6">
          <Channel
            messages={messages}
            currentStep={currentStep}
            totalSteps={messages.length}
            eveActive={eveActive}
            authenticated={authenticated}
          />
        </div>

        {/* Right Column: Bob */}
        <div className="lg:col-span-3">
          {bob ? (
            <PartyCard
              role="Bob"
              secrets={bob.secrets}
              authenticated={authenticated}
              fingerprint={bobKeyPair?.fingerprint}
              sessionKeyHex={bob.sessionKeyHex}
              confirmationValid={bob.confirmationValid}
              isActiveSender={isBobSender}
              isActiveReceiver={isBobReceiver}
              groupByteLength={currentGroup.byteLength}
            />
          ) : (
            <div className="h-64 rounded-card border border-card-border bg-card p-6" />
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        currentRound={getRoundNumber()}
        totalRounds={3}
        validationPassed={validationPassed}
        finalKeyHex={sessionKeyHex}
        keysMatch={keysMatch}
        durationMs={executionDurationMs}
        eveCompromised={eveActive && !authenticated && currentStep === 6}
        eveBlocked={eveActive && authenticated}
      />

      {/* Eve Adversary Panel */}
      <EvePanel
        eveActive={eveActive}
        authenticated={authenticated}
        eveResult={eveResult}
        publicMessages={messages}
        currentStep={currentStep}
      />
    </section>
  );
};
