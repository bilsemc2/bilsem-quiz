import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import styled from 'styled-components';

const GRID_SIZE = 5;
const CUBE_SIZE = 1;

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f0f2f5;
  gap: 24px;
  padding: 24px;
`;

const ControlPanel = styled.div`
  width: 280px;
  padding: 24px;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: fit-content;
  position: relative;
`;

const ViewContainer = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 300px;
  grid-template-rows: 1fr 300px;
  gap: 24px;
`;

const MainView = styled.div`
  grid-column: 1;
  grid-row: 1;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  overflow: hidden;
  min-height: 500px;
`;

const SideView = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 16px;
  position: relative;

  &::before {
    content: attr(data-label);
    position: absolute;
    top: 12px;
    left: 16px;
    font-size: 14px;
    font-weight: 500;
    color: #1a1a1a;
    background: rgba(255, 255, 255, 0.9);
    padding: 4px 8px;
    border-radius: 6px;
    z-index: 1;
  }

  canvas {
    width: 100%;
    height: 100%;
    border-radius: 12px;
  }
`;

const GridSection = styled.div`
  position: relative;
  padding: 32px;
`;

const DirectionLabel = styled.div`
  position: absolute;
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1;

  &.top {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
  }

  &.bottom {
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
  }

  &.left {
    left: 0;
    top: 50%;
    transform: translateY(-50%);
  }

  &.right {
    right: 0;
    top: 50%;
    transform: translateY(-50%);
  }
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(${GRID_SIZE}, 1fr);
  gap: 4px;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  position: relative;
`;

const GridCell = styled.button<{ $isActive: boolean; $color: string }>`
  aspect-ratio: 1;
  border: none;
  background: ${props => props.$isActive ? props.$color : 'white'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.$isActive ? '0 4px 8px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.1);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ControlButton = styled.button`
  padding: 12px 16px;
  border: none;
  background: #0066ff;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 14px;

  &:hover {
    background: #0052cc;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,102,255,0.2);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #e9ecef;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ColorPicker = styled.input`
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: transparent;
  padding: 4px;

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  &::-webkit-color-swatch {
    border: none;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
`;

const LayerControl = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
`;

const LayerLabel = styled.span`
  font-size: 14px;
  color: #4a5568;
  font-weight: 500;
`;

const LayerValue = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  min-width: 32px;
  text-align: center;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
`;

const ControlSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InfoIcon = styled.button`
  position: absolute;
  top: 24px;
  right: 24px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e2e8f0;
  border: none;
  color: #4a5568;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-family: serif;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  &:hover {
    background: #cbd5e1;
    transform: translateY(-1px);
  }
`;

const InstructionsPanel = styled.div<{ $isVisible: boolean }>`
  position: absolute;
  top: 70px;
  right: 24px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  width: 300px;
  opacity: ${props => props.$isVisible ? 1 : 0};
  visibility: ${props => props.$isVisible ? 'visible' : 'hidden'};
  transform: ${props => props.$isVisible ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.2s ease;
  z-index: 1000;

  &:before {
    content: '';
    position: absolute;
    top: -8px;
    right: 12px;
    width: 16px;
    height: 16px;
    background: white;
    transform: rotate(45deg);
    box-shadow: -2px -2px 4px rgba(0,0,0,0.05);
  }
`;

const InstructionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 12px 0;
`;

const InstructionList = styled.ul`
  margin: 0;
  padding-left: 20px;
  
  li {
    margin-bottom: 8px;
    color: #4a5568;
    font-size: 14px;
    line-height: 1.5;

    strong {
      color: #2d3748;
      font-weight: 500;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const Shortcut = styled.span`
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  color: #475569;
`;

const CubePage: React.FC = () => {
    const mainCanvasRef = useRef<HTMLDivElement>(null);
    const topViewRef = useRef<HTMLDivElement>(null);
    const frontViewRef = useRef<HTMLDivElement>(null);
    const rightViewRef = useRef<HTMLDivElement>(null);
    
    const topCanvasRef = useRef<HTMLCanvasElement>(null);
    const frontCanvasRef = useRef<HTMLCanvasElement>(null);
    const rightCanvasRef = useRef<HTMLCanvasElement>(null);

    const [currentLayer, setCurrentLayer] = useState(0);
    const sceneRef = useRef<THREE.Scene>();
    const cameraRef = useRef<THREE.PerspectiveCamera>();
    const rendererRef = useRef<THREE.WebGLRenderer>();
    const topViewRendererRef = useRef<THREE.WebGLRenderer>();
    const frontViewRendererRef = useRef<THREE.WebGLRenderer>();
    const rightViewRendererRef = useRef<THREE.WebGLRenderer>();

    const cubeGridRef = useRef(Array(GRID_SIZE).fill(null).map(() => 
        Array(GRID_SIZE).fill(null).map(() => 
            Array(GRID_SIZE).fill(null)
        )
    ));

    const isDraggingRef = useRef(false);
    const previousMousePositionRef = useRef({ x: 0, y: 0 });

    const setupViewCameras = () => {
        // Top view camera
        const topCamera = new THREE.OrthographicCamera(
            -GRID_SIZE/2, GRID_SIZE/2,
            GRID_SIZE/2, -GRID_SIZE/2,
            0.1, 1000
        );
        topCamera.position.set(0, 10, 0);
        topCamera.lookAt(0, 0, 0);

        // Front view camera
        const frontCamera = new THREE.OrthographicCamera(
            -GRID_SIZE/2, GRID_SIZE/2,
            GRID_SIZE/2, -GRID_SIZE/2,
            0.1, 1000
        );
        frontCamera.position.set(0, 0, 10);
        frontCamera.lookAt(0, 0, 0);

        // Right view camera
        const rightCamera = new THREE.OrthographicCamera(
            -GRID_SIZE/2, GRID_SIZE/2,
            GRID_SIZE/2, -GRID_SIZE/2,
            0.1, 1000
        );
        rightCamera.position.set(10, 0, 0);
        rightCamera.lookAt(0, 0, 0);

        return { topCamera, frontCamera, rightCamera };
    };

    const toggleCube = (x: number, y: number, z: number) => {
        if (!sceneRef.current) return;

        if (cubeGridRef.current[x][y][z]) {
            // Remove cube
            const cube = cubeGridRef.current[x][y][z].mesh;
            if (cube && sceneRef.current) {
                sceneRef.current.remove(cube);
            }
            cubeGridRef.current[x][y][z] = null;
        } else {
            // Add new cube
            const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9); // Slightly smaller than grid
            const color = (document.getElementById('cubeColor') as HTMLInputElement)?.value || '#4299e1';
            const material = new THREE.MeshPhongMaterial({ 
                color: color,
                shininess: 30,
                specular: 0x444444,
                transparent: true,
                opacity: 0.9
            });
            const cube = new THREE.Mesh(geometry, material);
            
            // Position cube correctly in the grid
            cube.position.set(
                x - Math.floor(GRID_SIZE/2),
                y,
                z - Math.floor(GRID_SIZE/2)
            );
            
            sceneRef.current.add(cube);
            cubeGridRef.current[x][y][z] = {
                mesh: cube,
                color: color
            };
        }
        
        // Update grid display after toggling cube
        setGrid(updateGridDisplay());
    };

    const clearAllCubes = () => {
        if (!sceneRef.current) return;

        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let z = 0; z < GRID_SIZE; z++) {
                    if (cubeGridRef.current[x][y][z]) {
                        sceneRef.current.remove(cubeGridRef.current[x][y][z].mesh);
                        cubeGridRef.current[x][y][z] = null;
                    }
                }
            }
        }
        updateGridDisplay();
    };

    const updateGridDisplay = () => {
        // Create a 2D array representing the current layer
        const grid = Array(GRID_SIZE).fill(null).map((_, x) =>
            Array(GRID_SIZE).fill(null).map((_, z) => ({
                isActive: !!cubeGridRef.current[x][currentLayer][z],
                color: cubeGridRef.current[x][currentLayer][z]?.color || '#4299e1'
            }))
        );
        return grid;
    };

    const setupViewRenderer = (canvas: HTMLCanvasElement, camera: THREE.Camera) => {
        const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
        return renderer;
    };

    useEffect(() => {
        if (!mainCanvasRef.current || !topViewRef.current || !frontViewRef.current || !rightViewRef.current) return;

        // Clear existing content
        topViewRef.current.innerHTML = '';
        frontViewRef.current.innerHTML = '';
        rightViewRef.current.innerHTML = '';

        // Create canvas elements for each view
        const topCanvas = document.createElement('canvas');
        const frontCanvas = document.createElement('canvas');
        const rightCanvas = document.createElement('canvas');

        // Set canvas size to match container size
        const setCanvasSize = (canvas: HTMLCanvasElement, container: HTMLDivElement) => {
            const { width, height } = container.getBoundingClientRect();
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
        };

        // Set initial sizes
        setCanvasSize(topCanvas, topViewRef.current);
        setCanvasSize(frontCanvas, frontViewRef.current);
        setCanvasSize(rightCanvas, rightViewRef.current);

        // Append canvases to their containers
        topViewRef.current.appendChild(topCanvas);
        frontViewRef.current.appendChild(frontCanvas);
        rightViewRef.current.appendChild(rightCanvas);

        // Store references
        topCanvasRef.current = topCanvas;
        frontCanvasRef.current = frontCanvas;
        rightCanvasRef.current = rightCanvas;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8f9fa);
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(8, 5, 8);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Grid helper - tek bir ızgara
        const size = GRID_SIZE;
        const divisions = GRID_SIZE;
        const gridHelper = new THREE.GridHelper(size, divisions);
        gridHelper.position.y = 0;
        scene.add(gridHelper);

        // Axes helper - eksenleri göster
        const axesHelper = new THREE.AxesHelper(GRID_SIZE);
        scene.add(axesHelper);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight2.position.set(-5, 5, -5);
        scene.add(directionalLight2);

        // Main renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mainCanvasRef.current.clientWidth, mainCanvasRef.current.clientHeight);
        renderer.shadowMap.enabled = true;
        mainCanvasRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Setup view cameras
        const { topCamera, frontCamera, rightCamera } = setupViewCameras();

        // Set up renderers
        const setupViewRenderer = (canvas: HTMLCanvasElement, camera: THREE.Camera) => {
            const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
            renderer.setSize(canvas.width, canvas.height, false);
            return renderer;
        };

        topViewRendererRef.current = setupViewRenderer(topCanvas, topCamera);
        frontViewRendererRef.current = setupViewRenderer(frontCanvas, frontCamera);
        rightViewRendererRef.current = setupViewRenderer(rightCanvas, rightCamera);

        // Handle window resize
        const handleResize = () => {
            if (!mainCanvasRef.current || !topViewRef.current || !frontViewRef.current || !rightViewRef.current) return;

            // Update main view
            const mainWidth = mainCanvasRef.current.clientWidth;
            const mainHeight = mainCanvasRef.current.clientHeight;
            
            if (camera && renderer) {
                camera.aspect = mainWidth / mainHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(mainWidth, mainHeight);
            }

            // Update side views
            if (topCanvas && frontCanvas && rightCanvas) {
                setCanvasSize(topCanvas, topViewRef.current);
                setCanvasSize(frontCanvas, frontViewRef.current);
                setCanvasSize(rightCanvas, rightViewRef.current);

                topViewRendererRef.current?.setSize(topCanvas.width, topCanvas.height, false);
                frontViewRendererRef.current?.setSize(frontCanvas.width, frontCanvas.height, false);
                rightViewRendererRef.current?.setSize(rightCanvas.width, rightCanvas.height, false);
            }
        };

        window.addEventListener('resize', handleResize);

        // Animation
        const animate = () => {
            requestAnimationFrame(animate);
            
            if (rendererRef.current && cameraRef.current && sceneRef.current) {
                rendererRef.current.render(sceneRef.current, cameraRef.current);
            }
            
            if (topViewRendererRef.current && topCamera && sceneRef.current) {
                topViewRendererRef.current.render(sceneRef.current, topCamera);
            }
            
            if (frontViewRendererRef.current && frontCamera && sceneRef.current) {
                frontViewRendererRef.current.render(sceneRef.current, frontCamera);
            }
            
            if (rightViewRendererRef.current && rightCamera && sceneRef.current) {
                rightViewRendererRef.current.render(sceneRef.current, rightCamera);
            }
        };
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            
            // Cleanup
            renderer.dispose();
            topViewRendererRef.current?.dispose();
            frontViewRendererRef.current?.dispose();
            rightViewRendererRef.current?.dispose();

            if (mainCanvasRef.current) mainCanvasRef.current.innerHTML = '';
            if (topViewRef.current) topViewRef.current.innerHTML = '';
            if (frontViewRef.current) frontViewRef.current.innerHTML = '';
            if (rightViewRef.current) rightViewRef.current.innerHTML = '';
        };
    }, []);

    const [grid, setGrid] = useState(updateGridDisplay());

    useEffect(() => {
        setGrid(updateGridDisplay());
    }, [currentLayer]);

    const [showInstructions, setShowInstructions] = useState(false);

    return (
        <PageContainer>
            <ControlPanel>
                <InfoIcon onClick={() => setShowInstructions(!showInstructions)}>
                    i
                </InfoIcon>
                
                <InstructionsPanel $isVisible={showInstructions}>
                    <InstructionTitle>Nasıl Kullanılır?</InstructionTitle>
                    <InstructionList>
                        <li>
                            <strong>3D Görünüm Kontrolü:</strong> Fareyi sürükleyerek küpü istediğiniz açıdan görüntüleyebilirsiniz
                        </li>
                        <li>
                            <strong>Küp Ekleme/Çıkarma:</strong> Soldaki ızgarada istediğiniz kareye tıklayarak küp ekleyip çıkarabilirsiniz
                        </li>
                        <li>
                            <strong>Renk Seçimi:</strong> Renk seçiciden istediğiniz rengi seçerek yeni ekleyeceğiniz küplerin rengini belirleyebilirsiniz
                        </li>
                        <li>
                            <strong>Katman Kontrolü:</strong> <Shortcut>+</Shortcut> ve <Shortcut>-</Shortcut> butonlarıyla katmanlar arası geçiş yapabilirsiniz
                        </li>
                        <li>
                            <strong>Yan Görünümler:</strong> Sağ taraftaki panellerde üstten, önden ve yandan görünümleri inceleyebilirsiniz
                        </li>
                    </InstructionList>
                </InstructionsPanel>

                <SectionTitle>Küp Kontrolü</SectionTitle>
                
                <ControlSection>
                    <LayerLabel>Renk Seçimi</LayerLabel>
                    <ColorPicker
                        type="color"
                        id="cubeColor"
                        defaultValue="#4299e1"
                    />
                </ControlSection>

                <ControlSection>
                    <LayerControl>
                        <LayerLabel>Katman</LayerLabel>
                        <ControlButton 
                            onClick={() => setCurrentLayer(Math.max(0, currentLayer - 1))}
                            disabled={currentLayer === 0}
                        >
                            -
                        </ControlButton>
                        <LayerValue>{currentLayer}</LayerValue>
                        <ControlButton 
                            onClick={() => setCurrentLayer(Math.min(GRID_SIZE - 1, currentLayer + 1))}
                            disabled={currentLayer === GRID_SIZE - 1}
                        >
                            +
                        </ControlButton>
                    </LayerControl>
                </ControlSection>

                <ControlSection>
                    <LayerLabel>Izgara</LayerLabel>
                    <GridSection>
                        <DirectionLabel className="top">Ön</DirectionLabel>
                        <DirectionLabel className="bottom">Arka</DirectionLabel>
                        <DirectionLabel className="left">Sol</DirectionLabel>
                        <DirectionLabel className="right">Sağ</DirectionLabel>
                        <GridContainer>
                            {grid.map((row, x) =>
                                row.map((cell, z) => (
                                    <GridCell
                                        key={`${x}-${z}`}
                                        $isActive={cell.isActive}
                                        $color={cell.color}
                                        onClick={() => toggleCube(x, currentLayer, z)}
                                    />
                                ))
                            )}
                        </GridContainer>
                    </GridSection>
                </ControlSection>
            </ControlPanel>

            <ViewContainer>
                <MainView ref={mainCanvasRef} />
                <SideView data-label="Üst Görünüm" style={{ gridColumn: 2, gridRow: 1 }} ref={topViewRef} />
                <SideView data-label="Ön Görünüm" style={{ gridColumn: 1, gridRow: 2 }} ref={frontViewRef} />
                <SideView data-label="Sağ Görünüm" style={{ gridColumn: 2, gridRow: 2 }} ref={rightViewRef} />
            </ViewContainer>
        </PageContainer>
    );
};

export default CubePage;
