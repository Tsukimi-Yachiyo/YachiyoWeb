document.addEventListener('DOMContentLoaded', function () {
  const homePage = document.getElementById('home-page')
  const infoPage = document.getElementById('info-page')
  const docsPage = document.getElementById('docs-page')
  const joinBtn = document.getElementById('join-btn')
  const backBtn = document.getElementById('back-btn')
  const viewDocsBtn = document.getElementById('view-docs-btn')
  const backFromDocsBtn = document.getElementById('back-from-docs-btn')
  const prevBtn = document.getElementById('prev-btn')
  const nextBtn = document.getElementById('next-btn')
  const currentPageSpan = document.getElementById('current-page')
  const totalPagesSpan = document.getElementById('total-pages')
  const infoPageContents = document.querySelectorAll('.info-page-content')
  const docTabs = document.querySelectorAll('.doc-tab')
  const docContents = document.querySelectorAll('.doc-content')
  const searchInput = document.getElementById('search-input')
  const searchBtn = document.getElementById('search-btn')
  const infoPageBgs = document.querySelectorAll('#info-page .bg-layer')
  const docsPageBgs = document.querySelectorAll('#docs-page .bg-layer')

  let currentInfoPage = 1
  const totalInfoPages = infoPageContents.length
  totalPagesSpan.textContent = totalInfoPages

  let infoCurrentBgIndex = 0
  let docsCurrentBgIndex = 0
  let bgChangeInterval = null

  function getRandomBgIndex(current, total) {
    let newIndex
    do {
      newIndex = Math.floor(Math.random() * total)
    } while (newIndex === current)
    return newIndex
  }

  function switchBg(bgLayers, currentIndexVar, newIndex) {
    bgLayers.forEach((bg, index) => {
      bg.classList.remove('active')
      if (index === newIndex) {
        bg.classList.add('active')
      }
    })
  }

  function startBgRotation() {
    if (bgChangeInterval) {
      clearInterval(bgChangeInterval)
    }

    bgChangeInterval = setInterval(() => {
      if (infoPage.classList.contains('active')) {
        const newIndex = getRandomBgIndex(infoCurrentBgIndex, infoPageBgs.length)
        switchBg(infoPageBgs, infoCurrentBgIndex, newIndex)
        infoCurrentBgIndex = newIndex
      } else if (docsPage.classList.contains('active')) {
        const newIndex = getRandomBgIndex(docsCurrentBgIndex, docsPageBgs.length)
        switchBg(docsPageBgs, docsCurrentBgIndex, newIndex)
        docsCurrentBgIndex = newIndex
      }
    }, 8000)
  }

  function showHomePage() {
    homePage.classList.add('active')
    infoPage.classList.remove('active')
    docsPage.classList.remove('active')
    if (bgChangeInterval) {
      clearInterval(bgChangeInterval)
      bgChangeInterval = null
    }
  }

  function showInfoPage() {
    homePage.classList.remove('active')
    infoPage.classList.add('active')
    docsPage.classList.remove('active')
    updatePageDisplay()
    startBgRotation()
  }

  function showDocsPage() {
    homePage.classList.remove('active')
    infoPage.classList.remove('active')
    docsPage.classList.add('active')
    removeHighlights()
    startBgRotation()
  }

  function goToPage(pageNum) {
    if (pageNum < 1 || pageNum > totalInfoPages) return

    infoPageContents.forEach((content, index) => {
      content.classList.remove('active')
      if (index + 1 === pageNum) {
        content.classList.add('active')
      }
    })

    currentInfoPage = pageNum
    updatePageDisplay()
  }

  function updatePageDisplay() {
    currentPageSpan.textContent = currentInfoPage
    prevBtn.disabled = currentInfoPage === 1
    nextBtn.disabled = currentInfoPage === totalInfoPages
  }

  function showDoc(docNum) {
    docTabs.forEach(tab => {
      tab.classList.remove('active')
      if (tab.dataset.doc == docNum) {
        tab.classList.add('active')
      }
    })

    docContents.forEach(content => {
      content.classList.remove('active')
      if (content.dataset.doc == docNum) {
        content.classList.add('active')
      }
    })

    removeHighlights()
  }

  function removeHighlights() {
    docContents.forEach(doc => {
      doc.querySelectorAll('.highlight').forEach(el => {
        el.outerHTML = el.innerHTML
      })
    })
  }

  function highlightText(text) {
    removeHighlights()
    if (!text.trim()) return

    const regex = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    let found = false

    docContents.forEach((doc, index) => {
      if (doc.classList.contains('active')) {
        const fullContent = doc.querySelector('.doc-full-content')
        if (fullContent) {
          const walker = document.createTreeWalker(fullContent, window.NodeFilter.SHOW_TEXT)
          const textNodes = []
          let node
          while ((node = walker.nextNode())) {
            if (node.textContent.trim()) {
              textNodes.push(node)
            }
          }

          textNodes.forEach(textNode => {
            if (regex.test(textNode.textContent)) {
              const parent = textNode.parentNode
              const newHTML = textNode.textContent.replace(
                regex,
                match => `<span class="highlight">${match}</span>`
              )
              const temp = document.createElement('div')
              temp.innerHTML = newHTML
              while (temp.firstChild) {
                parent.insertBefore(temp.firstChild, textNode)
              }
              parent.removeChild(textNode)
              found = true
            }
          })
        }
      }
    })

    if (!found) {
      let hasMatchInAny = false
      docContents.forEach((doc, index) => {
        const contentText = doc.textContent.toLowerCase()
        if (contentText.includes(text.toLowerCase())) {
          hasMatchInAny = true
          showDoc(index + 1)
          setTimeout(() => highlightText(text), 100)
        }
      })

      if (!hasMatchInAny) {
        alert('未找到匹配内容')
      }
    }
  }

  joinBtn.addEventListener('click', showInfoPage)
  backBtn.addEventListener('click', showHomePage)
  viewDocsBtn.addEventListener('click', showDocsPage)
  backFromDocsBtn.addEventListener('click', showInfoPage)

  prevBtn.addEventListener('click', function () {
    if (currentInfoPage > 1) {
      goToPage(currentInfoPage - 1)
    }
  })

  nextBtn.addEventListener('click', function () {
    if (currentInfoPage < totalInfoPages) {
      goToPage(currentInfoPage + 1)
    }
  })

  docTabs.forEach(tab => {
    tab.addEventListener('click', function () {
      showDoc(this.dataset.doc)
    })
  })

  searchBtn.addEventListener('click', function () {
    highlightText(searchInput.value)
  })

  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      highlightText(searchInput.value)
    }
  })

  document.addEventListener('keydown', function (e) {
    if (infoPage.classList.contains('active')) {
      if (e.key === 'ArrowLeft') {
        prevBtn.click()
      } else if (e.key === 'ArrowRight') {
        nextBtn.click()
      } else if (e.key === 'Escape') {
        backBtn.click()
      }
    } else if (docsPage.classList.contains('active')) {
      if (e.key === 'Escape') {
        backFromDocsBtn.click()
      }
    }
  })
})
