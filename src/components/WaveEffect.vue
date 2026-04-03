<script setup>
  import { ref, onMounted, onUnmounted } from 'vue'

  const waves = ref([
    {
      offset: 0,
      path: '',
      amplitude: 8,
      frequency: 0.02,
      speed: 0.03,
      randomOffsets: [],
    },
    {
      offset: 3,
      path: '',
      amplitude: 5,
      frequency: 0.015,
      speed: 0.02,
      randomOffsets: [],
    },
  ])

  let animationFrame = null
  let time = 0

  const generatePath = (amplitude, frequency, speed, randomOffsets) => {
    const points = []
    const width = 100
    const height = 100
    const segments = 20
    const segmentWidth = width / segments

    // 生成波浪点
    for (let i = 0; i <= segments; i++) {
      const x = i * segmentWidth
      const randomOffset = randomOffsets[i] || 0

      let y = 0
      // 使用多正弦叠加（傅里叶级数）
      y += amplitude * Math.sin(frequency * i + speed * time + randomOffset)
      y += amplitude * 0.5 * Math.sin(2 * frequency * i + 1.5 * speed * time)
      y += amplitude * 0.3 * Math.sin(3 * frequency * i + 2 * speed * time)

      // 二阶斯托克斯波浪修正
      y += amplitude * 0.1 * Math.sin(2 * (frequency * i + speed * time))

      const finalY = height - (height / 2 + y)
      points.push({ x, y: finalY })
    }

    // 使用贝塞尔曲线创建平滑路径
    let path = `M 0 ${height}`

    // 添加波浪点，使用贝塞尔曲线平滑连接
    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      const nextP = points[i + 1]

      if (nextP) {
        const midX = (p.x + nextP.x) / 2
        const midY = (p.y + nextP.y) / 2
        path += ` Q ${p.x} ${p.y} ${midX} ${midY}`
      } else {
        path += ` L ${p.x} ${p.y}`
      }
    }

    // 闭合路径
    path += ` L ${width} ${height} Z`

    return path
  }

  const animate = () => {
    time += 1

    waves.value.forEach(wave => {
      wave.path = generatePath(wave.amplitude, wave.frequency, wave.speed, wave.randomOffsets)
    })

    animationFrame = requestAnimationFrame(animate)
  }

  onMounted(() => {
    const segments = 20
    waves.value.forEach(wave => {
      for (let i = 0; i <= segments; i++) {
        wave.randomOffsets.push((Math.random() - 0.5) * 2)
      }
    })
    animate()
  })

  onUnmounted(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
  })
</script>

<template>
  <div class="wave-effect">
    <div class="wave-container">
      <svg
        v-for="(wave, index) in waves"
        :key="index"
        class="wave-svg"
        :class="{ 'wave-front': index === 0, 'wave-back': index === 1 }"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path :d="wave.path" fill="currentColor" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
  .wave-effect {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    background-color: transparent;
    pointer-events: none;
  }

  .wave-container {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .wave-svg {
    position: absolute;
    width: 120%;
    height: 120%;
    left: -10%;
    bottom: -10%;
  }

  .wave-front {
    color: #3498db;
    z-index: 2;
  }

  .wave-back {
    color: #64b5f6;
    z-index: 1;
    opacity: 0.6;
  }
</style>
