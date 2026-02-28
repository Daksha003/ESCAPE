import React, { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Box, Plane, Text, Sphere } from "@react-three/drei";
import * as THREE from "three";

const ClassroomScene = ({ onComplete, onShowUI, completed }) => {
  const teacherRef = useRef();
  const blackboardRef = useRef();
  const blackboardTextRef = useRef();
  const { camera } = useThree();

  // State for blackboard interaction
  const [isHoveringBlackboard, setIsHoveringBlackboard] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activationPhase, setActivationPhase] = useState("idle");

  // Store original camera position
  const originalCameraPos = useRef(new THREE.Vector3(0, 5, 10));
  const targetCameraPos = useRef(new THREE.Vector3(0, 4, -5));

  useFrame((state, delta) => {
    if (teacherRef.current) {
      teacherRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }

    if (blackboardRef.current) {
      const baseIntensity = 0.1;
      const hoverBonus = isHoveringBlackboard ? 0.2 : 0;
      const pulseBonus = Math.sin(state.clock.elapsedTime * 2) * 0.05;
      blackboardRef.current.material.emissiveIntensity =
        baseIntensity + hoverBonus + pulseBonus;
    }

    if (blackboardTextRef.current) {
      blackboardTextRef.current.fillColor = isHoveringBlackboard
        ? new THREE.Color("#ffffff")
        : new THREE.Color("#90ee90");
    }

    // Camera animation when activating
    if (activationPhase === "zooming") {
      camera.position.lerp(targetCameraPos.current, delta * 2);
      camera.lookAt(0, 4, -9.8);

      if (camera.position.distanceTo(targetCameraPos.current) < 0.1) {
        setActivationPhase("showing");
        setTimeout(() => {
          if (!completed) {
            onShowUI("aptitude");
          }
          setActivationPhase("idle");
          camera.position.copy(originalCameraPos.current);
        }, 500);
      }
    }
  });

  const handleBlackboardClick = (event) => {
    event.stopPropagation();
    if (completed || isActivating || activationPhase !== "idle") return;

    console.log("Blackboard clicked! Starting cognitive evaluation...");
    setIsActivating(true);
    setActivationPhase("zooming");
  };

  const handleBlackboardHover = (event) => {
    event.stopPropagation();
    if (completed) return;
    setIsHoveringBlackboard(true);
    document.body.style.cursor = "pointer";
  };

  const handleBlackboardLeave = (event) => {
    event.stopPropagation();
    setIsHoveringBlackboard(false);
    document.body.style.cursor = "auto";
  };

  return (
    <group>
      {/* Floor */}
      <Plane
        args={[25, 20]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial color="#f0f0f0" />
      </Plane>

      {/* Back wall */}
      <Plane args={[25, 10]} position={[0, 5, -10]}>
        <meshStandardMaterial color="#e8f4f8" />
      </Plane>

      {/* Side walls */}
      <Plane
        args={[20, 10]}
        position={[-12.5, 5, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <meshStandardMaterial color="#f0f8ff" />
      </Plane>
      <Plane
        args={[20, 10]}
        position={[12.5, 5, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <meshStandardMaterial color="#f0f8ff" />
      </Plane>

      {/* Front wall */}
      <Plane args={[10, 10]} position={[-7.5, 5, 10]}>
        <meshStandardMaterial color="#f0f8ff" />
      </Plane>
      <Plane args={[10, 10]} position={[7.5, 5, 10]}>
        <meshStandardMaterial color="#f0f8ff" />
      </Plane>

      {/* Interactive Blackboard */}
      <group>
        <Box
          ref={blackboardRef}
          args={[8, 4, 0.2]}
          position={[0, 4, -9.8]}
          onClick={handleBlackboardClick}
          onPointerOver={handleBlackboardHover}
          onPointerOut={handleBlackboardLeave}
        >
          <meshStandardMaterial
            color="#1a4d3a"
            emissive={isHoveringBlackboard ? "#1a5d3a" : "#0f2518"}
            emissiveIntensity={0.2}
          />
        </Box>

        {/* Blackboard frame */}
        <Box args={[8.4, 4.4, 0.1]} position={[0, 4, -9.7]}>
          <meshStandardMaterial color="#8b4513" />
        </Box>

        {/* Main text */}
        <Text
          ref={blackboardTextRef}
          position={[0, 5.2, -9.6]}
          fontSize={0.5}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          APTITUDE ROUND
        </Text>

        {/* Activation text */}
        {!completed && (
          <group>
            <Text
              position={[0, 4.2, -9.6]}
              fontSize={0.35}
              color={isHoveringBlackboard ? "#ffffff" : "#90ee90"}
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              "Cognitive Evaluation Ready"
            </Text>

            <Text
              position={[0, 3.5, -9.6]}
              fontSize={0.28}
              color={isHoveringBlackboard ? "#7fff00" : "#98fb98"}
              anchorX="center"
              anchorY="middle"
            >
              {isHoveringBlackboard
                ? "► CLICK TO BEGIN ◄"
                : "[ Click to Begin ]"}
            </Text>
          </group>
        )}

        {/* Completion text */}
        {completed && (
          <Text
            position={[0, 4, -9.6]}
            fontSize={0.4}
            color="#00ff00"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            ✓ EVALUATION COMPLETE
          </Text>
        )}
      </group>

      {/* Teacher */}
      <group ref={teacherRef} position={[2, 0, -8]}>
        <Sphere args={[0.5]} position={[0, 3, 0]}>
          <meshStandardMaterial color="#fdbcb4" />
        </Sphere>
        <Box args={[1, 1.5, 0.5]} position={[0, 2, 0]}>
          <meshStandardMaterial color="#4169e1" />
        </Box>
        <Box args={[0.25, 1, 0.25]} position={[-0.6, 2, 0]}>
          <meshStandardMaterial color="#fdbcb4" />
        </Box>
        <Box args={[0.25, 1, 0.25]} position={[0.6, 2, 0]}>
          <meshStandardMaterial color="#fdbcb4" />
        </Box>
        <Box args={[0.3, 1.2, 0.3]} position={[-0.3, 0.6, 0]}>
          <meshStandardMaterial color="#2f4f4f" />
        </Box>
        <Box args={[0.3, 1.2, 0.3]} position={[0.3, 0.6, 0]}>
          <meshStandardMaterial color="#2f4f4f" />
        </Box>
        <Sphere args={[0.08]} position={[-0.2, 3.1, 0.4]}>
          <meshStandardMaterial color="#000000" />
        </Sphere>
        <Sphere args={[0.08]} position={[0.2, 3.1, 0.4]}>
          <meshStandardMaterial color="#000000" />
        </Sphere>
        <Text
          position={[0, 1.2, 0.6]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          Prof. Smith
        </Text>
      </group>

      {/* Student Desks */}
      {Array.from({ length: 12 }, (_, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        const x = -4.5 + col * 3;
        const z = 2 + row * 2.5;

        return (
          <group key={i} position={[x, 0, z]}>
            <Box args={[2, 0.1, 1.2]} position={[0, 1, 0]}>
              <meshStandardMaterial color="#d2691e" />
            </Box>
            {[
              [-0.9, 0.5, -0.5],
              [0.9, 0.5, -0.5],
              [-0.9, 0.5, 0.5],
              [0.9, 0.5, 0.5],
            ].map((pos, j) => (
              <Box key={j} args={[0.08, 1, 0.08]} position={pos}>
                <meshStandardMaterial color="#8b4513" />
              </Box>
            ))}
            <Box args={[0.6, 0.05, 0.6]} position={[0, 0.5, 0.8]}>
              <meshStandardMaterial color="#654321" />
            </Box>
            <Box args={[0.6, 0.8, 0.05]} position={[0, 0.9, 0.5]}>
              <meshStandardMaterial color="#654321" />
            </Box>
          </group>
        );
      })}

      {/* Player's desk */}
      <group position={[0, 0, 5]}>
        <Box args={[2.5, 0.15, 1.5]} position={[0, 1, 0]}>
          <meshStandardMaterial color="#8b4513" />
        </Box>
        {[
          [-1.1, 0.5, -0.7],
          [1.1, 0.5, -0.7],
          [-1.1, 0.5, 0.7],
          [1.1, 0.5, 0.7],
        ].map((pos, i) => (
          <Box key={i} args={[0.1, 1, 0.1]} position={pos}>
            <meshStandardMaterial color="#654321" />
          </Box>
        ))}
        <Box args={[1.8, 0.08, 1.2]} position={[0, 1.08, 0]}>
          <meshStandardMaterial
            color={completed ? "#22c55e" : "#3b82f6"}
            transparent
            opacity={0.6}
          />
        </Box>
        <Text
          position={[0, 1.15, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.1}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {completed ? "✓ Completed" : "Blackboard to Start"}
        </Text>
      </group>

      {/* Floating particles */}
      {Array.from({ length: 15 }, (_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 20,
            Math.random() * 8 + 1,
            (Math.random() - 0.5) * 18,
          ]}
        >
          <sphereGeometry args={[0.02]} />
          <meshStandardMaterial
            color="#60a5fa"
            emissive="#3b82f6"
            emissiveIntensity={0.6}
          />
        </mesh>
      ))}

      {/* Ceiling lights */}
      {Array.from({ length: 6 }, (_, i) => {
        const x = -7.5 + (i % 3) * 7.5;
        const z = -5 + Math.floor(i / 3) * 10;

        return (
          <group key={i} position={[x, 8, z]}>
            <Box args={[2, 0.2, 1]} position={[0, 0, 0]}>
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={0.8}
              />
            </Box>
          </group>
        );
      })}

      {/* Success key */}
      {completed && (
        <group position={[3, 2.5, 5]}>
          <mesh>
            <cylinderGeometry args={[0.4, 0.4, 0.15]} />
            <meshStandardMaterial
              color="#ffd700"
              emissive="#ffaa00"
              emissiveIntensity={0.5}
            />
          </mesh>
          <Text
            position={[0, 0, 0.08]}
            fontSize={0.25}
            color="#8b4513"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            A
          </Text>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh
              key={i}
              position={[
                Math.sin((i * Math.PI) / 4) * 0.8,
                Math.sin(i) * 0.3,
                Math.cos((i * Math.PI) / 4) * 0.8,
              ]}
            >
              <sphereGeometry args={[0.03]} />
              <meshStandardMaterial
                color="#ffff00"
                emissive="#ffff00"
                emissiveIntensity={1}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

export default ClassroomScene;
