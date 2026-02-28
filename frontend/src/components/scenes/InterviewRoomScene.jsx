import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Box, Plane, Text, Sphere } from "@react-three/drei";

const InterviewRoomScene = ({
  onComplete,
  onShowUI,
  completed,
  isActive = false,
}) => {
  const fileRef = useRef();
  const hrRef = useRef();
  const headRef = useRef();
  const nodTimeRef = useRef(0);
  const tiltTimeRef = useRef(0);

  const handleFileClick = () => {
    if (!completed && onShowUI) {
      onShowUI("interview");
    }
  };

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (hrRef.current) {
      // Subtle breathing animation (very slow scale up/down)
      const breathe = Math.sin(time * 0.8) * 0.015;
      hrRef.current.scale.y = 1 + breathe;
      hrRef.current.scale.x = 1 - breathe * 0.5;
      hrRef.current.scale.z = 1 - breathe * 0.5;

      // Very slight vertical float
      hrRef.current.position.y = Math.sin(time * 0.5) * 0.02;

      // Subtle head tilt every few seconds
      tiltTimeRef.current += state.clock.getDelta();
      if (tiltTimeRef.current > 4) {
        tiltTimeRef.current = 0;
      }
      // Gentle tilt oscillation
      const tiltAngle = Math.sin(time * 0.3) * 0.05;

      // Nod when interview is active
      if (headRef.current) {
        nodTimeRef.current += state.clock.getDelta();
        let nodAngle = 0;
        if (isActive && nodTimeRef.current > 2) {
          // Gentle nod every 2+ seconds when active
          nodAngle = Math.sin(time * 2) * 0.08;
        }
        headRef.current.rotation.x = tiltAngle + nodAngle;
      }
    }

    if (fileRef.current) {
      fileRef.current.position.y = 1.02 + Math.sin(time * 2) * 0.03;
    }
  });

  return (
    <group>
      {/* Ambient light - slightly dimmed for spotlight effect */}
      <ambientLight intensity={0.4} />

      {/* Main directional light */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.5}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Spotlight on HR - soft white spotlight */}
      <spotLight
        position={[0, 6, -2]}
        angle={0.4}
        penumbra={0.8}
        intensity={1.5}
        color="#ffffff"
        castShadow
        shadow-mapSize={[512, 512]}
        target={hrRef.current}
      />

      {/* Secondary fill light - very subtle */}
      <pointLight position={[-5, 3, 2]} intensity={0.15} color="#f0f0f0" />

      {/* Floor */}
      <Plane
        args={[20, 20]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#f8fafc" />
      </Plane>

      {/* Walls */}
      <Plane args={[20, 8]} position={[0, 4, -10]} receiveShadow>
        <meshStandardMaterial color="#e2e8f0" />
      </Plane>

      <Plane
        args={[20, 8]}
        position={[-10, 4, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#f1f5f9" />
      </Plane>

      {/* Interview Table */}
      <group position={[0, 0, 0]}>
        <Box args={[6, 0.15, 3]} position={[0, 1, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#6b7280" />
        </Box>

        {/* Table Legs */}
        {[
          [-2.8, 0.5, -1.3],
          [2.8, 0.5, -1.3],
          [-2.8, 0.5, 1.3],
          [2.8, 0.5, 1.3],
        ].map((pos, i) => (
          <Box key={i} args={[0.1, 1, 0.1]} position={pos} castShadow>
            <meshStandardMaterial color="#374151" />
          </Box>
        ))}
      </group>

      {/* HR Character */}
      <group ref={hrRef} position={[0, 0, -2]}>
        {/* Head */}
        <group ref={headRef}>
          <Sphere args={[0.4]} position={[0, 2.5, 0]} castShadow>
            <meshStandardMaterial color="#fbbf24" />
          </Sphere>

          {/* Eyes */}
          <Sphere args={[0.05]} position={[-0.15, 2.6, 0.35]}>
            <meshStandardMaterial color="#000000" />
          </Sphere>
          <Sphere args={[0.05]} position={[0.15, 2.6, 0.35]}>
            <meshStandardMaterial color="#000000" />
          </Sphere>
        </group>

        {/* Body */}
        <Box args={[0.8, 1.2, 0.4]} position={[0, 1.6, 0]} castShadow>
          <meshStandardMaterial color="#1f2937" />
        </Box>

        {/* Arms */}
        <Box args={[0.2, 0.8, 0.2]} position={[-0.5, 1.6, 0]} castShadow>
          <meshStandardMaterial color="#fbbf24" />
        </Box>
        <Box args={[0.2, 0.8, 0.2]} position={[0.5, 1.6, 0]} castShadow>
          <meshStandardMaterial color="#fbbf24" />
        </Box>

        {/* HR Label */}
        <Text
          position={[0, 3.2, 0]}
          fontSize={0.15}
          color="#374151"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          HR INTERVIEWER
        </Text>
      </group>

      {/* Interview File */}
      <group
        ref={fileRef}
        position={[1.5, 1, 0.5]}
        onClick={handleFileClick}
        onPointerOver={(e) => (document.body.style.cursor = "pointer")}
        onPointerOut={(e) => (document.body.style.cursor = "auto")}
      >
        <Box args={[1, 0.05, 0.7]} position={[0, 0.03, 0]} castShadow>
          <meshStandardMaterial
            color={completed ? "#10b981" : "#ef4444"}
            emissive={completed ? "#059669" : "#dc2626"}
            emissiveIntensity={0.2}
          />
        </Box>

        <Text
          position={[0, 0.06, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.1}
          color="white"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {completed
            ? "INTERVIEW\nCOMPLETED ✓"
            : "INTERVIEW FILE\nClick to Open"}
        </Text>
      </group>

      {/* Wall Branding - ESCAPE Corporate Simulation Division */}
      <group position={[0, 5.5, -9.9]}>
        <Text
          position={[0, 0, 0]}
          fontSize={0.2}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
          fontWeight="medium"
          maxWidth={12}
        >
          ESCAPE – Corporate Simulation Division
        </Text>
      </group>

      {/* Room Decorations - minimal/removed for professionalism */}
      <group position={[-7, 0, -8]}>
        <Box args={[2, 3, 0.2]} position={[0, 1.5, 0]} castShadow>
          <meshStandardMaterial color="#64748b" />
        </Box>
        <Text
          position={[0, 2.8, 0.11]}
          fontSize={0.2}
          color="#e2e8f0"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          INTERVIEW ROOM
        </Text>
      </group>

      {/* Subtle ambient particles - very minimal, professional */}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 12,
            Math.random() * 4 + 2,
            (Math.random() - 0.5) * 12 - 5,
          ]}
        >
          <sphereGeometry args={[0.015]} />
          <meshStandardMaterial
            color="#cbd5e1"
            emissive="#94a3b8"
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}

      {/* Success key if completed */}
      {completed && (
        <group position={[-3, 2.5, 0]}>
          <mesh rotation={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.1]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={0.3}
            />
          </mesh>
          <Text
            position={[0, 0, 0.06]}
            fontSize={0.2}
            color="#92400e"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            C
          </Text>
        </group>
      )}
    </group>
  );
};

export default InterviewRoomScene;
