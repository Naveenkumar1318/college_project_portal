import { useCallback } from "react";
import Particles from "@tsparticles/react";
import { loadFull } from "tsparticles";

function ParticlesBackground() {
  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        fullScreen: {
          enable: true,
          zIndex: -1
        },
        background: {
          color: "transparent"
        },
        particles: {
          number: { value: 80 },
          color: { value: "#8f94fb" },
          links: {
            enable: true,
            distance: 150,
            color: "#6c63ff",
            opacity: 0.3,
            width: 1
          },
          move: {
            enable: true,
            speed: 1.2
          },
          size: {
            value: { min: 1, max: 3 }
          },
          opacity: {
            value: 0.6
          }
        }
      }}
    />
  );
}

export default ParticlesBackground;