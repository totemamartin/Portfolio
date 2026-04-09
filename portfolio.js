(function() {
  var PASSWORD = 'portfolio2026';
  var unlocked = sessionStorage.getItem('portfolio_unlocked') === 'true';
  var pendingProject = null;

  // Per-project hover data (gradient fallback + optional image)
  var projectHoverData = { 1: { gradient: 'g6', image: null }, 2: { gradient: 'g1', image: 'images/img-1773779658028.png' }, 3: { gradient: 'g2', image: 'images/img-1773333027969.png' }, 4: { gradient: 'g3', image: 'images/img-1773333132525.png' }, 5: { gradient: 'g4', image: 'images/img-1773333109932.png' }, 6: { gradient: 'g5', image: null } };
  var projectNextData = { 1: { id: 2, title: 'Design Team — Casavo' }, 2: { id: 3, title: 'Treatwell PRO' }, 3: { id: 4, title: 'Flowe App' }, 4: { id: 5, title: 'Sky Wi-Fi' }, 6: { id: 1, title: 'Elevate Documents — Deel' } };

  function showPage(id) {
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    var el = document.getElementById(id);
    if (el) {
      el.classList.add('active');
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          el.style.transition = 'opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)';
          el.style.opacity = '';
          el.style.transform = '';
          setTimeout(function() { el.style.transition = ''; }, 550);
        });
      });
    }
    window.scrollTo(0, 0);
    var dock = document.getElementById('dock');
    if (dock) {
      var onProj = id !== 'home';
      dock.classList.toggle('visible', onProj);
      if (onProj) {
        var pid = parseInt(id.replace('project-', ''));
        var np = projectNextData[pid];
        var arrow = '<svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="2.5" fill="none" style="display:inline-block;vertical-align:middle;margin-left:5px"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
        dock.innerHTML = '<a class="dock-link" href="#" onclick="showPage(&quot;home&quot;);return false;">Home</a>'
          + (np ? '<a class="dock-link" href="#" onclick="showProject('+np.id+');return false;">Next'+arrow+'</a>' : '');
      }
    }
    if (typeof window._resumeSphere === 'function') window._resumeSphere(id === 'home');
  }

  window.openLightbox = function(src) {
    var lb = document.getElementById('imgLightbox');
    lb.querySelector('img').src = src;
    lb.classList.add('open');
  };
  window.closeLightbox = function() {
    document.getElementById('imgLightbox').classList.remove('open');
  };
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') window.closeLightbox(); });

  function openModal(n) {
    pendingProject = n;
    document.getElementById('pwInput').value = '';
    document.getElementById('pwError').textContent = '';
    document.getElementById('pwInput').classList.remove('error');
    document.getElementById('pwOverlay').classList.add('visible');
    setTimeout(function() { document.getElementById('pwInput').focus(); }, 300);
  }

  function closeModal() { document.getElementById('pwOverlay').classList.remove('visible'); }

  function requestProject(n) {
    if (unlocked) { showPage('project-' + n); }
    else { openModal(n); }
  }

  function showProject(n) { requestProject(n); }

  function scrollToProjects() {
    setTimeout(function() {
      var el = document.getElementById('projects-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  function attemptUnlock() {
    if (document.getElementById('pwInput').value === PASSWORD) {
      unlocked = true;
      sessionStorage.setItem('portfolio_unlocked', 'true');
      var target = pendingProject;
      closeModal();
      showPage('project-' + target);
    } else {
      var inp = document.getElementById('pwInput');
      inp.classList.add('error');
      document.getElementById('pwError').textContent = 'Incorrect password. Please try again.';
      inp.value = '';
      setTimeout(function() { inp.classList.remove('error'); }, 400);
    }
  }

  window.showPage = showPage;
  window.requestProject = requestProject;
  window.showProject = showProject;
  window.scrollToProjects = scrollToProjects;

  document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('pwSubmit').addEventListener('click', attemptUnlock);
    document.getElementById('pwInput').addEventListener('keydown', function(e) { if (e.key === 'Enter') attemptUnlock(); });
    document.getElementById('pwClose').addEventListener('click', closeModal);
    document.getElementById('pwOverlay').addEventListener('click', function(e) { if (e.target === document.getElementById('pwOverlay')) closeModal(); });

    var showPw = false;
    document.getElementById('pwToggle').addEventListener('click', function() {
      showPw = !showPw;
      document.getElementById('pwInput').type = showPw ? 'text' : 'password';
      document.getElementById('eyeIcon').innerHTML = showPw
        ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
        : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
    });

    var cursor = document.getElementById('cursor');
    var ring = document.getElementById('cursorRing');
    if (cursor && ring) {
      var rx = 0, ry = 0, mx = 0, my = 0;
      document.addEventListener('mousemove', function(e) {
        mx = e.clientX; my = e.clientY;
        cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
      });
      (function anim() {
        rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
        ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
        requestAnimationFrame(anim);
      })();
      document.querySelectorAll('[onclick], a, button').forEach(function(el) {
        el.addEventListener('mouseenter', function() { cursor.style.width = '14px'; cursor.style.height = '14px'; ring.style.width = '52px'; ring.style.height = '52px'; });
        el.addEventListener('mouseleave', function() { cursor.style.width = '8px'; cursor.style.height = '8px'; ring.style.width = '36px'; ring.style.height = '36px'; });
      });
    }

    var hoverImg = document.getElementById('projHoverImg');
    var hoverImgInner = document.getElementById('projHoverImgInner');
    var hoverX = 0, hoverY = 0, targetX = 0, targetY = 0;
    (function animateHover() {
      hoverX += (targetX - hoverX) * 0.1; hoverY += (targetY - hoverY) * 0.1;
      hoverImg.style.left = hoverX + 'px'; hoverImg.style.top = hoverY + 'px';
      requestAnimationFrame(animateHover);
    })();

    document.querySelectorAll('.pcard[data-gradient]').forEach(function(card) {
      var left = card.querySelector('.pcard-left');
      if (!left) return;
      var projId = parseInt(card.getAttribute('onclick').match(/\d+/)[0]);
      var hd = projectHoverData[projId] || {};
      left.addEventListener('mouseenter', function() {
        if (hd.image) {
          hoverImgInner.className = 'pcard-img';
          hoverImgInner.style.backgroundImage = "url('" + hd.image + "')";
          hoverImgInner.style.backgroundSize = 'cover';
          hoverImgInner.style.backgroundPosition = 'center';
        } else {
          hoverImgInner.className = 'pcard-img ' + (hd.gradient || card.getAttribute('data-gradient'));
          hoverImgInner.style.backgroundImage = '';
        }
        hoverImg.classList.add('visible');
      });
      left.addEventListener('mouseleave', function() { hoverImg.classList.remove('visible'); });
    });

    document.addEventListener('mousemove', function(e) { targetX = e.clientX + 200; targetY = e.clientY - 300; });

  });
})();

(function() {
  var wrap = document.getElementById('sphereWrap');
  if (!wrap) return;
  var W = wrap.offsetWidth || 1000, H = wrap.offsetHeight || 1000;
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
  camera.position.z = 5.5;
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  wrap.appendChild(renderer.domElement);

  var DOT_COUNT = 1600;
  var positions = new Float32Array(DOT_COUNT * 3);
  var originalPositions = new Float32Array(DOT_COUNT * 3);
  var velocities = new Float32Array(DOT_COUNT * 3);
  var SHAPES = ['sphere', 'cube', 'octahedron', 'tetrahedron', 'torus', 'icosahedron', 'dodecahedron', 'mobius'];
  var shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];

  function geoToPts(geo, count) {
    var arr = geo.attributes.position.array, result = [];
    for (var i = 0; i < arr.length; i += 3) result.push(new THREE.Vector3(arr[i], arr[i+1], arr[i+2]));
    var base = result.length;
    while (result.length < count) { var idx = (result.length) % base; result.push(result[idx].clone()); }
    return result.slice(0, count);
  }

  function getPolyhedronFaces(verts, indices) {
    var faces = [];
    for (var i = 0; i < indices.length; i += 3)
      faces.push([new THREE.Vector3().fromArray(verts, indices[i]*3), new THREE.Vector3().fromArray(verts, indices[i+1]*3), new THREE.Vector3().fromArray(verts, indices[i+2]*3)]);
    return faces;
  }

  function distributeEvenlyOnFaces(faces, count) {
    var dotsPerFace = count / faces.length;
    var n = Math.max(1, Math.round((-3 + Math.sqrt(9 + 8 * dotsPerFace)) / 2));
    var pts = [];
    faces.forEach(function(f) {
      for (var i = 0; i <= n; i++) for (var j = 0; j <= n - i; j++) {
        var u = i / n, v = j / n;
        pts.push(new THREE.Vector3(f[0].x+u*(f[1].x-f[0].x)+v*(f[2].x-f[0].x), f[0].y+u*(f[1].y-f[0].y)+v*(f[2].y-f[0].y), f[0].z+u*(f[1].z-f[0].z)+v*(f[2].z-f[0].z)));
      }
    });
    while (pts.length < count) pts.push(pts[pts.length - 1].clone());
    return pts.slice(0, count);
  }

  var R = 1.15;
  function buildShapePts(s) {
    var pts;
    if (s === 'sphere') {
      pts = [];
      for (var i = 0; i < DOT_COUNT; i++) { var phi = Math.acos(1 - 2*(i+0.5)/DOT_COUNT); var theta = Math.PI*(1+Math.sqrt(5))*i; pts.push(new THREE.Vector3(R*Math.sin(phi)*Math.cos(theta), R*Math.sin(phi)*Math.sin(theta), R*Math.cos(phi))); }
    } else if (s === 'cube') {
      var h = R/Math.sqrt(3); var cv = [-h,-h,-h,h,-h,-h,h,h,-h,-h,h,-h,-h,-h,h,h,-h,h,h,h,h,-h,h,h]; var ci = [0,1,2,0,2,3,4,6,5,4,7,6,0,5,1,0,4,5,2,6,3,3,6,7,0,7,4,0,3,7,1,5,6,1,6,2]; pts = distributeEvenlyOnFaces(getPolyhedronFaces(cv, ci), DOT_COUNT);
    } else if (s === 'octahedron') {
      var r = R; var ov = [r,0,0,-r,0,0,0,r,0,0,-r,0,0,0,r,0,0,-r]; var oi = [0,2,4,0,4,3,0,3,5,0,5,2,1,4,2,1,3,4,1,5,3,1,2,5]; pts = distributeEvenlyOnFaces(getPolyhedronFaces(ov, oi), DOT_COUNT);
    } else if (s === 'tetrahedron') {
      var t = R/Math.sqrt(3); var tv = [t,t,t,t,-t,-t,-t,t,-t,-t,-t,t]; var ti = [0,1,2,0,2,3,0,3,1,1,3,2]; pts = distributeEvenlyOnFaces(getPolyhedronFaces(tv, ti), DOT_COUNT);
    } else if (s === 'torus') {
      pts = geoToPts(new THREE.TorusGeometry(0.76, 0.38, 32, 50), DOT_COUNT);
    } else if (s === 'icosahedron') {
      pts = geoToPts(new THREE.IcosahedronGeometry(R * 0.92, 4), DOT_COUNT);
    } else if (s === 'dodecahedron') {
      pts = geoToPts(new THREE.DodecahedronGeometry(R * 0.88, 4), DOT_COUNT);
    } else {
      pts = [];
      var uN = 80, vN = 20, RM = 0.86, w = 0.44;
      for (var ui = 0; ui < uN; ui++) {
        for (var vi = 0; vi < vN; vi++) {
          var u = (ui / uN) * Math.PI * 2, v = -w + (vi / (vN - 1)) * 2 * w;
          pts.push(new THREE.Vector3((RM + v * Math.cos(u / 2)) * Math.cos(u), (RM + v * Math.cos(u / 2)) * Math.sin(u), v * Math.sin(u / 2)));
        }
      }
    }
    return pts;
  }

  var pts = buildShapePts(shape);
  for (var i = 0; i < DOT_COUNT; i++) { positions[i*3]=pts[i].x; positions[i*3+1]=pts[i].y; positions[i*3+2]=pts[i].z; originalPositions[i*3]=pts[i].x; originalPositions[i*3+1]=pts[i].y; originalPositions[i*3+2]=pts[i].z; }

  // Morph system
  var morphStart = new Float32Array(DOT_COUNT * 3);
  var morphTarget = new Float32Array(DOT_COUNT * 3);
  var morphT = 1.0;
  var shapeIdx = SHAPES.indexOf(shape);

  function startMorph(newShape) {
    morphStart.set(originalPositions);
    var npts = buildShapePts(newShape);
    for (var i = 0; i < DOT_COUNT; i++) { morphTarget[i*3]=npts[i].x; morphTarget[i*3+1]=npts[i].y; morphTarget[i*3+2]=npts[i].z; }
    morphT = 0;
    shape = newShape;
  }

  // Tap to cycle shapes on mobile
  var tapStartX, tapStartY;
  wrap.addEventListener('touchstart', function(e) { tapStartX = e.touches[0].clientX; tapStartY = e.touches[0].clientY; }, { passive: true });
  wrap.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - tapStartX, dy = e.changedTouches[0].clientY - tapStartY;
    if (Math.sqrt(dx*dx+dy*dy) < 10) { shapeIdx = (shapeIdx + 1) % SHAPES.length; startMorph(SHAPES[shapeIdx]); }
  }, { passive: true });

  var geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var material = new THREE.PointsMaterial({ color: 0xf0ede8, size: 0.018, sizeAttenuation: true, transparent: true, opacity: 0.75 });
  var points = new THREE.Points(geometry, material);
  scene.add(points);

  var mouse3D = new THREE.Vector3(), mouse3DTarget = new THREE.Vector3(), mouseMoved = false;
  var mouseNDC = new THREE.Vector2(0, 0), mouseNDCTarget = new THREE.Vector2(0, 0);

  function handlePointer(clientX, clientY) {
    var rect = wrap.getBoundingClientRect(); var cW = rect.width, cH = rect.height;
    mouseNDCTarget.x = ((clientX-rect.left)/cW)*2-1; mouseNDCTarget.y = -((clientY-rect.top)/cH)*2+1;
    var vec = new THREE.Vector3(mouseNDCTarget.x, mouseNDCTarget.y, 0.5); vec.unproject(camera);
    var dir = vec.sub(camera.position).normalize(); var dist = -camera.position.z/dir.z;
    var newPos = new THREE.Vector3().copy(camera.position).addScaledVector(dir, dist);
    if (!mouseMoved) { mouse3D.copy(newPos); mouse3DTarget.copy(newPos); mouseNDC.copy(mouseNDCTarget); mouseMoved = true; }
    else { mouse3DTarget.copy(newPos); }
  }

  document.addEventListener('mousemove', function(e) { handlePointer(e.clientX, e.clientY); });
  wrap.addEventListener('touchstart', function(e) { e.preventDefault(); handlePointer(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  wrap.addEventListener('touchmove',  function(e) { e.preventDefault(); handlePointer(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });

  var DISTURB_RADIUS=1.6, DISTURB_STRENGTH=15, RETURN_SPEED=0.055, VELOCITY_DAMP=0.82, autoRotY=0, sphereRunning=true;

  function animateSphere() {
    if (!sphereRunning) return;
    requestAnimationFrame(animateSphere);
    autoRotY += 0.003; points.rotation.y = autoRotY;
    points.rotation.x += (mouseNDC.y*0.25 - points.rotation.x)*0.05;
    mouse3D.lerp(mouse3DTarget, 0.12); mouseNDC.x += (mouseNDCTarget.x-mouseNDC.x)*0.08; mouseNDC.y += (mouseNDCTarget.y-mouseNDC.y)*0.08;
    if (morphT < 1) {
      morphT = Math.min(1, morphT + 0.018);
      var ease = morphT < 0.5 ? 2*morphT*morphT : -1+(4-2*morphT)*morphT;
      for (var k = 0; k < DOT_COUNT * 3; k++) originalPositions[k] = morphStart[k] + (morphTarget[k] - morphStart[k]) * ease;
      if (morphT >= 1) morphStart.set(originalPositions);
    }
    points.updateMatrixWorld();
    var pos = geometry.attributes.position.array;
    var invMatrix = new THREE.Matrix4().copy(points.matrixWorld).invert();
    var localMouse = mouse3D.clone().applyMatrix4(invMatrix);
    for (var i = 0; i < DOT_COUNT; i++) {
      var ix=i*3, iy=i*3+1, iz=i*3+2;
      if (mouseMoved) { var dx=pos[ix]-localMouse.x, dy=pos[iy]-localMouse.y, dz=pos[iz]-localMouse.z; var d=Math.sqrt(dx*dx+dy*dy+dz*dz); if (d<DISTURB_RADIUS) { var force=(1-d/DISTURB_RADIUS)*DISTURB_STRENGTH; velocities[ix]+=(dx/(d+0.001))*force; velocities[iy]+=(dy/(d+0.001))*force; velocities[iz]+=(dz/(d+0.001))*force*0.6; } }
      pos[ix]+=velocities[ix]; pos[iy]+=velocities[iy]; pos[iz]+=velocities[iz];
      pos[ix]+=(originalPositions[ix]-pos[ix])*RETURN_SPEED; pos[iy]+=(originalPositions[iy]-pos[iy])*RETURN_SPEED; pos[iz]+=(originalPositions[iz]-pos[iz])*RETURN_SPEED;
      velocities[ix]*=VELOCITY_DAMP; velocities[iy]*=VELOCITY_DAMP; velocities[iz]*=VELOCITY_DAMP;
    }
    geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  }

  window._resumeSphere = function(active) {
    if (active && !sphereRunning) { sphereRunning = true; renderer.setSize(W, H); animateSphere(); }
    else if (!active) { sphereRunning = false; }
  };
  animateSphere();
})();