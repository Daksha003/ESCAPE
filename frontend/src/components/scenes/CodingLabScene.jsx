import React, { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Box, Plane, Text } from "@react-three/drei";
import * as THREE from "three";

const CodingLabScene = ({
  onComplete,
  onShowUI,
  completed,
  isActivating,
  onActivationComplete,
}) => {
  const pcRef = useRef();
  const screenRef = useRef();
  const keyboardRef = useRef();
  const { camera } = useThree();

  // State for activation sequence
  const [activationPhase, setActivationPhase] = useState("idle"); // idle, zooming, booted, complete
  const [bootText, setBootText] = useState("");
  const [showBootText, setShowBootText] = useState(false);

  // Store original camera position
  const originalCameraPos = useRef(new THREE.Vector3(0, 5, 10));
  const targetCameraPos = useRef(new THREE.Vector3(0, 3, -3));

  // Boot sequence lines
  const bootLines = [
    "Initializing Programming Challenge...",
    "Loading Test Cases...",
    "Compiling Environment...",
    "Ready.",
  ];
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedLines, setDisplayedLines] = useState([]);

  // Handle activation from parent
  useEffect(() => {
    if (isActivating && activationPhase === "idle" && !completed) {
      startActivationSequence();
    }
  }, [isActivating]);

  const startActivationSequence = () => {
    console.log("Starting coding activation sequence...");
    setActivationPhase("zooming");
  };

  // Camera zoom and boot animation
  useFrame((state, delta) => {
    // Screen flicker effect during zoom
    if (screenRef.current) {
      if (activationPhase === "zooming") {
        // Flicker effect - subtle brightness variation
        const flicker = 0.4 + Math.random() * 0.3;
        screenRef.current.material.emissiveIntensity = flicker;
      } else if (activationPhase === "booted") {
        // Stable glow
        screenRef.current.material.emissiveIntensity = 0.6;
      } else if (activationPhase === "complete") {
        screenRef.current.material.emissiveIntensity = 0.4;
      } else {
        // Default idle animation
        screenRef.current.material.emissiveIntensity =
          0.6 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
      }
    }

    // Keyboard RGB effect (only when not activating)
    if (keyboardRef.current && activationPhase === "idle") {
      const time = state.clock.elapsedTime;
      keyboardRef.current.material.emissive.setHSL((time * 0.1) % 1, 1, 0.3);
    }

    // Camera zoom animation
    if (activationPhase === "zooming") {
      // Smooth lerp camera towards monitor
      camera.position.lerp(targetCameraPos.current, delta * 1.5);
      camera.lookAt(0, 1.5, -1);

      // Check if camera reached target
      if (camera.position.distanceTo(targetCameraPos.current) < 0.1) {
        console.log("Camera zoom complete, starting boot sequence");
        setActivationPhase("booted");
        setShowBootText(true);
        startBootSequence();
      }
    }

    // Return camera to original position after boot sequence
    if (activationPhase === "complete") {
      camera.position.lerp(originalCameraPos.current, delta * 2);
      camera.lookAt(0, 2, 0);
    }
  });

  // Boot text typewriter effect
  const startBootSequence = async () => {
    for (let i = 0; i < bootLines.length; i++) {
      const line = bootLines[i];
      let text = "";

      // Typewriter effect for each line
      for (let j = 0; j < line.length; j++) {
        text += line[j];
        setBootText(text);
        await new Promise((resolve) =>
          setTimeout(resolve, 20 + Math.random() * 20),
        );
      }

      // Add line to displayed lines
      setDisplayedLines((prev) => [...prev, text]);
      setBootText("");

      // Wait before next line (except after last line)
      if (i < bootLines.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    // Wait 500ms after final line, then show coding UI
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log("Boot sequence complete, showing coding UI");
    setActivationPhase("complete");
    setShowBootText(false);

    // Notify parent that activation is complete
    if (onActivationComplete) {
      onActivationComplete();
    }
  };

  const handlePCClick = (event) => {
    event.stopPropagation();
    if (completed || activationPhase !== "idle") return;

    console.log("PC clicked! Starting activation...");
    onShowUI("coding");
  };

  return (
    <group>
      {/* Floor - Dark but visible */}
      <Plane
        args={[25, 20]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          color="#1a1a2e"
          emissive="#0f3460"
          emissiveIntensity={0.2}
        />
      </Plane>

      {/* Walls - More visible with neon accents */}
      <Plane args={[25, 10]} position={[0, 5, -10]}>
        <meshStandardMaterial
          color="#16213e"
          emissive="#0f3460"
          emissiveIntensity={0.3}
        />
      </Plane>

      <Plane
        args={[20, 10]}
        position={[-12.5, 5, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <meshStandardMaterial
          color="#16213e"
          emissive="#0f3460"
          emissiveIntensity={0.3}
        />
      </Plane>

      <Plane
        args={[20, 10]}
        position={[12.5, 5, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <meshStandardMaterial
          color="#16213e"
          emissive="#0f3460"
          emissiveIntensity={0.3}
        />
      </Plane>

      {/* Toned down neon strips on walls */}
      {Array.from({ length: 8 }, (_, i) => (
        <Box
          key={i}
          args={[0.1, 0.3, 15]}
          position={[-12.4, 1.5 + i * 1, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <meshStandardMaterial
            color="#0088cc"
            emissive="#0088cc"
            emissiveIntensity={0.6}
          />
        </Box>
      ))}

      {/* Subtle vertical neon strips */}
      {Array.from({ length: 6 }, (_, i) => (
        <Box
          key={`v-${i}`}
          args={[0.1, 8, 0.3]}
          position={[-8 + i * 4, 4, -9.8]}
        >
          <meshStandardMaterial
            color="#cc4488"
            emissive="#cc4488"
            emissiveIntensity={0.5}
          />
        </Box>
      ))}

      {/* Enhanced Gaming Desk with subtle RGB strips */}
      <group position={[0, 0, 0]}>
        <Box args={[6, 0.2, 3]} position={[0, 1, 0]}>
          <meshStandardMaterial
            color="#2a2a2a"
            emissive="#1a4d72"
            emissiveIntensity={0.2}
          />
        </Box>

        {/* Subtle RGB strips */}
        <Box args={[6.2, 0.08, 0.15]} position={[0, 1.12, -1.45]}>
          <meshStandardMaterial
            color="#0088cc"
            emissive="#0088cc"
            emissiveIntensity={0.8}
          />
        </Box>
        <Box args={[6.2, 0.08, 0.15]} position={[0, 1.12, 1.45]}>
          <meshStandardMaterial
            color="#0088cc"
            emissive="#0088cc"
            emissiveIntensity={0.8}
          />
        </Box>
        <Box args={[0.15, 0.08, 3]} position={[-3, 1.12, 0]}>
          <meshStandardMaterial
            color="#cc4488"
            emissive="#cc4488"
            emissiveIntensity={0.6}
          />
        </Box>
        <Box args={[0.15, 0.08, 3]} position={[3, 1.12, 0]}>
          <meshStandardMaterial
            color="#cc4488"
            emissive="#cc4488"
            emissiveIntensity={0.6}
          />
        </Box>

        {/* Desk Legs with subtle accent */}
        {[
          [-2.8, 0.5, -1.4],
          [2.8, 0.5, -1.4],
          [-2.8, 0.5, 1.4],
          [2.8, 0.5, 1.4],
        ].map((pos, i) => (
          <Box key={i} args={[0.15, 1, 0.15]} position={pos}>
            <meshStandardMaterial
              color="#333333"
              emissive="#0066aa"
              emissiveIntensity={0.3}
            />
          </Box>
        ))}
      </group>

      {/* Enhanced Gaming PC Setup - More visible and less overwhelming */}
      <group
        ref={pcRef}
        position={[0, 1, 0]}
        onClick={handlePCClick}
        onPointerOver={(e) => {
          if (activationPhase === "idle" && !completed) {
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={(e) => (document.body.style.cursor = "auto")}
      >
        {/* Monitor - Clear and prominent */}
        <Box args={[4, 2.4, 0.3]} position={[0, 1.5, -1.2]}>
          <meshStandardMaterial
            color="#2a2a2a"
            emissive="#1a1a3a"
            emissiveIntensity={0.1}
          />
        </Box>

        {/* Screen with clear visibility */}
        <Box ref={screenRef} args={[3.7, 2.1, 0.08]} position={[0, 1.5, -1.05]}>
          <meshStandardMaterial
            color={
              completed
                ? "#003300"
                : activationPhase !== "idle"
                  ? "#001a00"
                  : "#001122"
            }
            emissive={
              completed
                ? "#004400"
                : activationPhase !== "idle"
                  ? "#003300"
                  : "#002244"
            }
            emissiveIntensity={0.4}
          />
        </Box>

        {/* Monitor bezel - Subtle accent */}
        <Box args={[4.1, 2.5, 0.05]} position={[0, 1.5, -1.15]}>
          <meshStandardMaterial
            color="#1a1a1a"
            emissive="#0066cc"
            emissiveIntensity={0.2}
          />
        </Box>

        {/* Monitor stand - Clean design */}
        <Box args={[0.5, 1, 0.5]} position={[0, 0.6, -1.2]}>
          <meshStandardMaterial
            color="#333333"
            emissive="#004488"
            emissiveIntensity={0.3}
          />
        </Box>

        {/* Gaming Keyboard - Clear and functional */}
        <Box
          ref={keyboardRef}
          args={[2.2, 0.12, 0.7]}
          position={[0, 0.16, 0.4]}
        >
          <meshStandardMaterial
            color="#2a2a2a"
            emissive="#003366"
            emissiveIntensity={activationPhase !== "idle" ? 0.5 : 0.2}
          />
        </Box>

        {/* Subtle key highlights - Not overwhelming */}
        {Array.from({ length: 12 }, (_, i) => (
          <Box
            key={i}
            args={[0.08, 0.02, 0.08]}
            position={[
              -0.8 + (i % 4) * 0.5,
              0.18,
              0.2 + Math.floor(i / 4) * 0.2,
            ]}
          >
            <meshStandardMaterial
              color="#f0f0f0"
              emissive={activationPhase !== "idle" ? "#00ff88" : "#0088cc"}
              emissiveIntensity={activationPhase !== "idle" ? 0.8 : 0.3}
            />
          </Box>
        ))}

        {/* Gaming Mouse - Clear and defined */}
        <Box args={[0.18, 0.08, 0.3]} position={[1.4, 0.14, 0.2]}>
          <meshStandardMaterial
            color="#1a1a1a"
            emissive={activationPhase !== "idle" ? "#00ff88" : "#cc0044"}
            emissiveIntensity={activationPhase !== "idle" ? 0.8 : 0.4}
          />
        </Box>

        {/* Mouse pad - Subtle glow */}
        <Box args={[2, 0.03, 1.2]} position={[0.9, 0.12, 0.2]}>
          <meshStandardMaterial
            color="#0a0a0a"
            emissive={activationPhase !== "idle" ? "#00ff88" : "#4400cc"}
            emissiveIntensity={activationPhase !== "idle" ? 0.5 : 0.2}
          />
        </Box>

        {/* Secondary monitor */}
        <Box args={[2, 1.5, 0.2]} position={[-2.5, 1.3, -1]}>
          <meshStandardMaterial
            color="#1a1a1a"
            emissive="#002200"
            emissiveIntensity={0.2}
          />
        </Box>

        {/* Screen content - Normal state */}
        {activationPhase === "idle" && (
          <Text
            position={[0, 1.5, -1]}
            fontSize={0.15}
            color="#00ccff"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {completed
              ? "> CHALLENGE COMPLETED ✓\n> ACCESS GRANTED\n> KEY_B UNLOCKED\n> SYSTEM: READY"
              : "> MULTI-LANGUAGE CODING\n> SELECT YOUR LANGUAGE\n> WRITE FACTORIAL CODE\n> RUN 3 TEST CASES\n> CLICK TO START"}
          </Text>
        )}

        {/* Boot text animation */}
        {showBootText && (
          <group position={[0, 1.5, -1]}>
            {displayedLines.map((line, index) => (
              <Text
                key={index}
                position={[0, 0.4 - index * 0.2, 0]}
                fontSize={0.12}
                color="#00ff00"
                anchorX="left"
                anchorY="middle"
                fontWeight="bold"
              >
                {`> ${line}`}
              </Text>
            ))}
            {bootText && (
              <Text
                position={[0, 0.4 - displayedLines.length * 0.2, 0]}
                fontSize={0.12}
                color="#00ff00"
                anchorX="left"
                anchorY="middle"
                fontWeight="bold"
              >
                {`> ${bootText}_`}
              </Text>
            )}
          </group>
        )}
      </group>

      {/* Enhanced Gaming PC Tower - More visible */}
      <group position={[-2.8, 0, -0.5]}>
        <Box args={[0.7, 2, 0.9]} position={[0, 1, 0]}>
          <meshStandardMaterial
            color="#1a1a1a"
            emissive="#0a4d72"
            emissiveIntensity={0.4}
          />
        </Box>

        {/* Enhanced RGB lighting strips on PC */}
        {Array.from({ length: 6 }, (_, i) => (
          <Box
            key={i}
            args={[0.75, 0.08, 0.08]}
            position={[0, 0.2 + i * 0.3, 0.46]}
          >
            <meshStandardMaterial
              color={
                i % 3 === 0 ? "#00ffff" : i % 3 === 1 ? "#ff00ff" : "#ffff00"
              }
              emissive={
                i % 3 === 0 ? "#00ffff" : i % 3 === 1 ? "#ff00ff" : "#ffff00"
              }
              emissiveIntensity={activationPhase !== "idle" ? 1.5 : 1.2}
            />
          </Box>
        ))}

        {/* PC front panel with logo */}
        <Box args={[0.6, 0.3, 0.05]} position={[0, 1.5, 0.46]}>
          <meshStandardMaterial
            color="#000000"
            emissive={activationPhase !== "idle" ? "#00ff88" : "#00ff88"}
            emissiveIntensity={activationPhase !== "idle" ? 1.2 : 0.8}
          />
        </Box>
      </group>

      {/* Enhanced ceiling with better lighting */}
      <Plane
        args={[25, 20]}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 9, 0]}
      >
        <meshStandardMaterial
          color="#0a0a1a"
          emissive="#1a4d72"
          emissiveIntensity={0.2}
        />
      </Plane>

      {/* Enhanced neon ceiling grid - More vibrant */}
      {Array.from({ length: 6 }, (_, i) => (
        <Box
          key={`ceiling-x-${i}`}
          args={[25, 0.08, 0.15]}
          position={[-12 + i * 5, 8.85, 0]}
        >
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={1.2}
          />
        </Box>
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <Box
          key={`ceiling-z-${i}`}
          args={[0.15, 0.08, 20]}
          position={[0, 8.85, -8 + i * 5]}
        >
          <meshStandardMaterial
            color="#ff00ff"
            emissive="#ff00ff"
            emissiveIntensity={1.2}
          />
        </Box>
      ))}

      {/* Enhanced atmospheric particles - More visible */}
      {Array.from({ length: 40 }, (_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 20,
            Math.random() * 8 + 1,
            (Math.random() - 0.5) * 18,
          ]}
        >
          <sphereGeometry args={[0.03]} />
          <meshStandardMaterial
            color={
              i % 3 === 0 ? "#00ffff" : i % 3 === 1 ? "#ff00ff" : "#00ff88"
            }
            emissive={
              i % 3 === 0 ? "#00ffff" : i % 3 === 1 ? "#ff00ff" : "#00ff88"
            }
            emissiveIntensity={1}
          />
        </mesh>
      ))}

      {/* Enhanced lab signage */}
      <group position={[0, 0, -9]}>
        <Box args={[5, 1.2, 0.15]} position={[0, 6.5, 0]}>
          <meshStandardMaterial
            color="#000000"
            emissive="#00ffff"
            emissiveIntensity={0.8}
          />
        </Box>
        <Text
          position={[0, 6.8, 0.08]}
          fontSize={0.5}
          color="#00ffff"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          CODING LAB
        </Text>
        <Text
          position={[0, 6.2, 0.08]}
          fontSize={0.18}
          color="#40ff80"
          anchorX="center"
          anchorY="middle"
        >
          :: MULTI-LANGUAGE PROGRAMMING ::
        </Text>
      </group>

      {/* Additional ambient lighting */}
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#00ffff" />
      <pointLight position={[-5, 3, -5]} intensity={0.3} color="#ff00ff" />
      <pointLight position={[5, 3, 5]} intensity={0.3} color="#00ff88" />

      {/* Success key if completed */}
      {completed && (
        <group position={[4, 3.5, 0]}>
          <mesh>
            <cylinderGeometry args={[0.4, 0.4, 0.15]} />
            <meshStandardMaterial
              color="#00ffff"
              emissive="#00aaaa"
              emissiveIntensity={1.2}
            />
          </mesh>
          <Text
            position={[0, 0, 0.08]}
            fontSize={0.25}
            color="#000000"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            B
          </Text>
        </group>
      )}
    </group>
  );
};

export default CodingLabScene;
