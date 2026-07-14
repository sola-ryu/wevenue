#!/bin/bash
# Generate Tailwind CSS from global.css source, then append custom styles
npx tailwindcss -i ./src/styles/global.css -o ./public/styles.css --minify
cat >> ./public/styles.css << 'EOF'

@keyframes sparkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.sparkle {
  animation: sparkle 2s ease-in-out infinite;
}

@keyframes hero-glow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.hero-glow {
  background: radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 20%, rgba(168, 85, 247, 0.1) 0%, transparent 50%),
              radial-gradient(ellipse at 20% 30%, rgba(236, 72, 153, 0.08) 0%, transparent 50%);
}

.agent-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.agent-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.1);
}

.gradient-text {
  background: linear-gradient(to right, #6366f1, #a855f7, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background: currentColor;
  margin-left: 2px;
  animation: blink 1s step-end infinite;
  vertical-align: text-bottom;
}

@keyframes blink {
  50% { opacity: 0; }
}
EOF
echo "CSS built: $(wc -c < ./public/styles.css) bytes"
