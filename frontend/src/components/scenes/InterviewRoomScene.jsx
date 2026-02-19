import React, { useRef, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { Box, Plane, Text, Sphere, useGLTF } from "@react-three/drei";

// GLB Character Model Component - loads the GLB file
// Replace '/character.glb' with your actual model path in the public folder
const GLBCharacter = ({ position = [0, 0, -2] }) => {
  const { scene } = useGLTF("/character.glb");
  const modelRef = useRef();

  // Idle Breathing Animation using useFrame
  useFrame((state) => {
    if (modelRef.current) {
      // Subtle up-down breathing motion (very smooth and minimal)
      // Using sine wave for smooth oscillation
      const breathe = Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
      modelRef.current.position.y = position[1] + breathe;
    }
  });

  return (
    <primitive
      ref={modelRef}
      object={scene.clone()}
      castShadow
      receiveShadow
      scale={1}
      position={position}
    />
  );
};

// Primitive Fallback Character (when GLB is not available)
const PrimitiveCharacter = ({ position = [0, 0, -2] }) => {
  const characterRef = useRef();

  // Idle Breathing Animation using useFrame
  useFrame((state) => {
    if (characterRef.current) {
      // Subtle up-down breathing motion (very smooth and minimal)
      // Using sine wave for smooth oscillation
      const breathe = Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
      characterRef.current.position.y = position[1] + breathe;
    }
  });

  return (
    <group ref={characterRef} position={position}>
      {/* Head */}
      <Sphere args={[0.4]} position={[0, 2.5, 0]} castShadow>
        <meshStandardMaterial color="#fbbf24" />
      </Sphere>

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

      {/* Eyes */}
      <Sphere args={[0.05]} position={[-0.15, 2.6, 0.35]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>
      <Sphere args={[0.05]} position={[0.15, 2.6, 0.35]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>

      {/* HR Label */}
      <Text
        position={[0, 3.2, 0]}
        fontSize={0.15}
        color="#1f2937"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        HR INTERVIEWER
      </Text>
    </group>
  );
};

// Character Component - tries GLB first, falls back to primitive on error
const Character = ({ position = [0, 0, -2] }) => {
  return (
    <Suspense fallback={<PrimitiveCharacter position={position} />}>
      <ErrorBoundary fallback={<PrimitiveCharacter position={position} />}>
        <GLBCharacter position={position} />
      </ErrorBoundary>
    </Suspense>
  );
};

// Error Boundary Component to handle GLB load errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const InterviewRoomScene = ({ onComplete, onShowUI, completed }) => {
  const fileRef = useRef();
  const hrRef = useRef();

  useFrame((state) => {
    if (hrRef.current) {
      hrRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
    if (fileRef.current) {
      fileRef.current.position.y =
        1.02 + Math.sin(state.clock.elapsedTime * 2) * 0.03;
    }
  });

  const handleFileClick = () => {
    if (!completed) {
      onShowUI("interview");
    }
  };

  return (
    <group>
      {/* Lighting Setup - Interview Room */}
      {/* Low ambient light for base illumination */}
      <ambientLight intensity={0.2} color="#ffffff" />

      {/* Directional light with shadow casting for main light */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.8}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />

      {/* Spotlight focused on player/interviewer position */}
      <spotLight
        position={[0, 6, 2]}
        angle={0.5}
        penumbra={0.5}
        intensity={1.5}
        color="#a78bfa"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        target-position={[0, 0, -2]}
      />

      {/* Additional fill light from the side */}
      <directionalLight
        position={[-3, 4, -1]}
        intensity={0.3}
        color="#e0e7ff"
      />

      {/* Floor - Improved with receiveShadow and better material */}
      <Plane
        args={[20, 20]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#f8fafc" roughness={0.8} metalness={0.1} />
      </Plane>

      {/* Walls */}
      <Plane args={[20, 8]} position={[0, 4, -10]}>
        <meshStandardMaterial color="#e2e8f0" />
      </Plane>

      <Plane
        args={[20, 8]}
        position={[-10, 4, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <meshStandardMaterial color="#f1f5f9" />
      </Plane>

      {/* Interview Table - Improved with reflectivity */}
      <group position={[0, 0, 0]}>
        {/* Table Top - Slightly reflective for realism */}
        <Box args={[6, 0.15, 3]} position={[0, 1, 0]} castShadow receiveShadow>
          <meshStandardMaterial
            color="#6b7280"
            roughness={0.4}
            metalness={0.3}
          />
        </Box>

        {/* Table Legs */}
        {[
          [-2.8, 0.5, -1.3],
          [2.8, 0.5, -1.3],
          [-2.8, 0.5, 1.3],
          [2.8, 0.5, 1.3],
        ].map((pos, i) => (
          <Box key={i} args={[0.1, 1, 0.1]} position={pos} castShadow>
            <meshStandardMaterial
              color="#374151"
              roughness={0.6}
              metalness={0.2}
            />
          </Box>
        ))}
      </group>

      {/* HR Character - Now with GLB support and breathing animation */}
      <Suspense fallback={null}>
        <Character position={[0, 0, -2]} />
      </Suspense>

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

      {/* Room Decorations */}
      <group position={[-7, 0, -8]}>
        <Box args={[2, 3, 0.2]} position={[0, 1.5, 0]} castShadow>
          <meshStandardMaterial color="#7c3aed" />
        </Box>
        <Text
          position={[0, 2.8, 0.11]}
          fontSize={0.25}
          color="white"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          INTERVIEW ROOM
        </Text>
      </group>

      {/* Professional Atmosphere */}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 15,
            Math.random() * 6 + 1,
            (Math.random() - 0.5) * 15,
          ]}
        >
          <sphereGeometry args={[0.025]} />
          <meshStandardMaterial
            color="#7c3aed"
            emissive="#6d28d9"
            emissiveIntensity={0.4}
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
