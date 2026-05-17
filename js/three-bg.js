/* ============================================
   ML Visual Guide — Three.js Neural Network Background
   ============================================ */

function initNeuralNetBg(canvasId, opts = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof THREE === 'undefined') return;

  const W = canvas.parentElement.clientWidth || window.innerWidth;
  const H = canvas.parentElement.clientHeight || window.innerHeight;

  // Scene setup
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
  camera.position.set(0, 0, opts.camZ || 18);

  // Layers config
  const layers = opts.layers || [3, 5, 5, 3];
  const colors = [0x00d4ff, 0xa855f7, 0xa855f7, 0x10b981];
  const nodes = [];
  const edges = [];
  const layerX = (i) => (i - (layers.length - 1) / 2) * (opts.xSpread || 5);

  // Create nodes
  layers.forEach((count, li) => {
    nodes.push([]);
    const geo = new THREE.SphereGeometry(opts.nodeR || 0.28, 16, 16);
    for (let ni = 0; ni < count; ni++) {
      const y = (ni - (count - 1) / 2) * (opts.ySpread || 2);
      const mat = new THREE.MeshPhongMaterial({
        color: colors[li] || 0x00d4ff,
        emissive: colors[li] || 0x00d4ff,
        emissiveIntensity: 0.4,
        transparent: true, opacity: 0.85
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(layerX(li), y, 0);
      mesh.userData = { baseY: y, li, ni, phase: Math.random() * Math.PI * 2 };
      scene.add(mesh);
      nodes[li].push(mesh);
    }
  });

  // Create edges
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x334455, transparent: true, opacity: 0.25 });
  for (let li = 0; li < layers.length - 1; li++) {
    edges.push([]);
    nodes[li].forEach(src => {
      nodes[li + 1].forEach(dst => {
        const pts = [src.position, dst.position];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geo, edgeMat.clone());
        scene.add(line);
        edges[li].push({ line, src, dst });
      });
    });
  }

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
  const pointLight1 = new THREE.PointLight(0x00d4ff, 2, 30);
  pointLight1.position.set(-5, 5, 10);
  scene.add(pointLight1);
  const pointLight2 = new THREE.PointLight(0xa855f7, 1.5, 30);
  pointLight2.position.set(5, -5, 10);
  scene.add(pointLight2);

  // Signal propagation
  let signals = [];
  let signalTimer = 0;

  function spawnSignal() {
    const srcNode = nodes[0][Math.floor(Math.random() * nodes[0].length)];
    signals.push({ li: 0, ni: nodes[0].indexOf(srcNode), t: 0, path: [[0, nodes[0].indexOf(srcNode)]] });
  }

  // Floating particles
  const particleCount = 60;
  const pGeo = new THREE.BufferGeometry();
  const pPositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    pPositions[i * 3] = (Math.random() - 0.5) * 30;
    pPositions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    pPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({ color: 0x00d4ff, size: 0.06, transparent: true, opacity: 0.4 });
  scene.add(new THREE.Points(pGeo, pMat));

  // Animate signal along edge
  function getSignalPos(src, dst, t) {
    return {
      x: src.position.x + (dst.position.x - src.position.x) * t,
      y: src.position.y + (dst.position.y - src.position.y) * t,
      z: src.position.z + (dst.position.z - src.position.z) * t,
    };
  }

  // Signal sphere
  const sigGeo = new THREE.SphereGeometry(0.12, 8, 8);
  const sigMeshes = [];
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(sigGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }));
    scene.add(m);
    sigMeshes.push(m);
  }
  let sigIdx = 0;

  let mouse = { x: 0, y: 0 };
  canvas.parentElement.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouse.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
  });

  let t = 0;
  let animId;
  function animate() {
    animId = requestAnimationFrame(animate);
    t += 0.008;

    // Gentle camera parallax
    camera.position.x += (mouse.x * 2 - camera.position.x) * 0.02;
    camera.position.y += (mouse.y * 1 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    // Float nodes
    nodes.forEach(layer => layer.forEach(n => {
      n.position.y = n.userData.baseY + Math.sin(t * 0.8 + n.userData.phase) * 0.15;
      n.material.emissiveIntensity = 0.3 + Math.sin(t + n.userData.phase) * 0.15;
    }));

    // Spawn signals
    signalTimer += 0.016;
    if (signalTimer > 1.2 && signals.length < 5) {
      spawnSignal();
      signalTimer = 0;
    }

    // Animate signals
    signals = signals.filter(sig => {
      sig.t += 0.04;
      if (sig.t >= 1) {
        sig.t = 0;
        sig.li++;
        if (sig.li >= layers.length - 1) return false;
        // pick random next node
        sig.path.push([sig.li + 1, Math.floor(Math.random() * layers[sig.li + 1])]);
      }
      // draw signal
      const [curLi, curNi] = sig.path[sig.path.length - 2] || [0, 0];
      const [nxtLi, nxtNi] = sig.path[sig.path.length - 1] || [1, 0];
      if (!nodes[curLi] || !nodes[nxtLi]) return false;
      const src = nodes[curLi][curNi];
      const dst = nodes[nxtLi][nxtNi];
      if (!src || !dst) return false;
      const pos = getSignalPos(src, dst, sig.t);
      const sm = sigMeshes[sigIdx % sigMeshes.length];
      sm.position.set(pos.x, pos.y, pos.z);
      sm.material.opacity = 0.9;
      sm.material.color.setHex(colors[nxtLi] || 0x00d4ff);
      sigIdx++;
      // Highlight edge
      edges[curLi] && edges[curLi].forEach(e => {
        if (e.src === src && e.dst === dst) {
          e.line.material.opacity = 0.7;
          e.line.material.color.setHex(colors[nxtLi] || 0x00d4ff);
        }
      });
      return true;
    });

    // Fade edges back
    edges.forEach(layer => layer.forEach(e => {
      if (e.line.material.opacity > 0.25) {
        e.line.material.opacity -= 0.008;
        if (e.line.material.opacity < 0.25) {
          e.line.material.opacity = 0.25;
          e.line.material.color.setHex(0x334455);
        }
      }
    }));

    // Fade signal spheres
    sigMeshes.forEach(m => { m.material.opacity *= 0.97; });

    // Particles drift
    const pPos = pGeo.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3 + 1] += 0.008;
      if (pPos[i * 3 + 1] > 12) pPos[i * 3 + 1] = -12;
    }
    pGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }

  animate();

  // Resize handler
  function onResize() {
    const W = canvas.parentElement.clientWidth;
    const H = canvas.parentElement.clientHeight;
    renderer.setSize(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
}

// Small Three.js scene for topic page headers
function initTopicHeaderBg(canvasId, color1 = 0x00d4ff, color2 = 0xa855f7) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof THREE === 'undefined') return;

  const W = canvas.parentElement.clientWidth || 800;
  const H = canvas.parentElement.clientHeight || 200;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, W / H, 0.1, 100);
  camera.position.z = 8;

  // Create floating dots
  const count = 80;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const cols = new Float32Array(count * 3);
  const c1 = new THREE.Color(color1), c2 = new THREE.Color(color2);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 20;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
    const c = Math.random() < 0.5 ? c1 : c2;
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const mat = new THREE.PointsMaterial({ size: 0.08, vertexColors: true, transparent: true, opacity: 0.6 });
  scene.add(new THREE.Points(geo, mat));

  let t = 0;
  let animId;
  function animate() {
    animId = requestAnimationFrame(animate);
    t += 0.005;
    const p = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      p[i * 3 + 1] += 0.005;
      p[i * 3] += Math.sin(t + i) * 0.003;
      if (p[i * 3 + 1] > 5) p[i * 3 + 1] = -5;
    }
    geo.attributes.position.needsUpdate = true;
    camera.position.x = Math.sin(t * 0.3) * 0.5;
    renderer.render(scene, camera);
  }
  animate();

  function onResize() {
    const W = canvas.parentElement.clientWidth;
    const H = canvas.parentElement.clientHeight;
    renderer.setSize(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);
  return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); renderer.dispose(); };
}
