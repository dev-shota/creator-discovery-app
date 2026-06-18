<template>
  <div class="page-container">
    <!-- 背景の有機的シェイプ（GPT image 2 生成素材を切り出し透過・ふわふわ浮く・装飾のみ） -->
    <div class="bg-decor" aria-hidden="true">
      <span class="blob b1"></span>
      <span class="blob b2"></span>
      <span class="blob b3"></span>
      <span class="blob b4"></span>
    </div>

    <!-- Top bar: brand + theme toggle -->
    <header class="topbar">
      <a class="brand" href="/">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="32" height="32">
            <rect width="64" height="64" rx="16" fill="#ed3a8c" />
            <circle cx="50" cy="15" r="6" fill="#eff33c" />
            <circle cx="28" cy="30" r="12" fill="none" stroke="#fff" stroke-width="5" />
            <line x1="37" y1="39" x2="49" y2="51" stroke="#fff" stroke-width="6" stroke-linecap="round" />
          </svg>
        </span>
        <span class="brand-name">Creator Discovery</span>
      </a>
      <button
        class="theme-toggle"
        :title="isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'"
        :aria-label="isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'"
        @click="toggleTheme"
      >
        <svg v-if="isDark" viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
          <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
        </svg>
        <svg v-else viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </button>
    </header>

    <!-- Hero（検索ファースト・左テキスト / 右ビジュアル）。作り手/制作会社を選択して作品を
         表示している間（is-compact）は、大ヒーロー画像・説明・コンセプト画像を畳んで検索バー
         だけのコンパクトヘッダにする＝結果が装飾の下に押し込まれず、メイン画像も動かない
         （ユーザー指摘「検索でメイン画像の位置が変わる」「作業中は装飾が邪魔」への対応）。 -->
    <section class="hero" :class="{ 'is-compact': selectedStaff || selectedStudio }">
      <div class="hero-text">
        <span class="eyebrow">creator discovery</span>
        <h1 class="hero-title">
          作り手から、<span class="ac-pink">作品</span>、<br class="hero-br" />そして<span class="ac-teal">アニメ</span>へ。
        </h1>
        <!-- 説明文は文節境界で折り返す（語の途中で割れない＝ユーザー要望 2026-06-15）。
             中黒リストは CJK 既定で自然に折り返すが、動詞句「たどって見つける。」は auto-phrase でも
             「た／どって」と割れた（Edge149 実測）ので inline-block の塊（.nb）にして割れを禁じる。 -->
        <p class="hero-sub">
          <span class="hand">次に見る一本</span>を、好きな作者・監督・声優・制作会社から<span class="nb">たどって見つける。</span>
        </p>
        <!-- モバイル専用コンセプト画像（デスクトップは右の大ヒーロー画像 .hero-visual を使う）。
             見出し・説明の下、検索ボックスの上に中央寄せで置く＝検索バーと結果の間に挟まらない。
             「見出しの右に小さく」は窮屈でレイアウトが崩れる（ユーザー報告 2026-06-15）ため、
             下に中央配置で意図的な hero イラストとして見せる。結果表示中は is-compact で畳む。 -->
        <NuxtImg src="/mascot.png" alt="Creator Discovery マスコット" class="hero-img-mini" width="420" height="420" loading="lazy" format="webp" />

        <!-- Search（ヒーローの主役アクション・候補は入力直下にドロップダウン） -->
        <div class="search-hero">
          <!-- 検索モード切替（作者/作品名/制作会社…）。広い画面はタブ、狭ければプルダウン。
               2026-06-15 user req: 初期は主要5モード + 「もっと見る」トグル。展開で副6モード。
               選択中モードが副に属する場合は moreTabsOpen を自動で true にする（watcher）。 -->
          <div class="search-mode" role="tablist" aria-label="検索モード">
            <button
              v-for="t in SEARCH_TABS_PRIMARY"
              :key="t.mode"
              type="button"
              class="mode-btn"
              role="tab"
              :aria-selected="searchMode === t.mode"
              :class="{ 'is-active': searchMode === t.mode }"
              @click="setSearchMode(t.mode)"
            ><span class="mode-icon" aria-hidden="true" v-html="modeIconSvg(t.mode)"></span>{{ t.label }}</button>
            <template v-if="moreTabsOpen">
              <button
                v-for="t in SEARCH_TABS_SECONDARY"
                :key="t.mode"
                type="button"
                class="mode-btn mode-btn-secondary"
                role="tab"
                :aria-selected="searchMode === t.mode"
                :class="{ 'is-active': searchMode === t.mode }"
                @click="setSearchMode(t.mode)"
              ><span class="mode-icon" aria-hidden="true" v-html="modeIconSvg(t.mode)"></span>{{ t.label }}</button>
            </template>
            <button
              type="button"
              class="mode-btn mode-more"
              :aria-expanded="moreTabsOpen"
              aria-controls="search-mode-secondary"
              @click="moreTabsOpen = !moreTabsOpen"
            >{{ moreTabsOpen ? '閉じる' : 'もっと見る' }}</button>
          </div>
          <!-- 狭い画面: ネイティブの select ポップアップでなく独自メニュー（ハンバーガー式・
               タップで開閉・選択で自動クローズ）。CSS の media query でタブと出し分ける。 -->
          <div class="mode-menu">
            <button
              type="button"
              class="mode-menu-trigger"
              aria-label="検索モードを選ぶ"
              :aria-expanded="modeMenuOpen"
              @click.stop="modeMenuOpen = !modeMenuOpen"
            >
              <span class="mode-menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>
              <span class="mode-menu-current">{{ currentModeLabel }}</span>
            </button>
            <ul v-if="modeMenuOpen" class="mode-menu-list" role="menu">
              <li
                v-for="t in SEARCH_TABS"
                :key="t.mode"
                role="menuitem"
                class="mode-menu-item"
                :class="{ 'is-active': searchMode === t.mode }"
                @click="onPickMode(t.mode)"
              >{{ t.label }}</li>
            </ul>
          </div>

          <div class="search-box">
            <div class="search-row">
              <input
                ref="searchInputEl"
                :value="searchQuery"
                type="text"
                class="search-input"
                :placeholder="searchPlaceholder"
                role="combobox"
                aria-autocomplete="list"
                aria-controls="staff-candidate-list"
                :aria-expanded="dropdownOpen"
                :aria-activedescendant="activeId"
                autocomplete="off"
                @input="onInput"
                @keydown="onKeydown"
                @focus="onFocus"
              />
              <button class="search-btn" @click="searchStaff">検索</button>
            </div>

            <!-- 候補ドロップダウン（live 検索・入力直下にアンカー） -->
            <ul
              v-if="dropdownOpen"
              id="staff-candidate-list"
              class="candidate-list"
              role="listbox"
              :aria-label="searchMode === 'title' ? '作品の候補' : searchMode === 'studio' ? '制作会社の候補' : '作り手の候補'"
            >
              <!-- 入力が空でフォーカス中: 現モードの「最近見た」を出す（recent セクション・#1） -->
              <template v-if="showRecent || showPopularStudios">
                <template v-if="showRecent">
                  <li class="candidate-section-label">{{ recentLabel }}</li>
                  <li
                    v-for="r in currentRecent"
                    :key="`recent-${r.id}`"
                    class="candidate-item"
                    role="option"
                    :aria-selected="false"
                    @mousedown.prevent
                    @click="selectRecent(r)"
                  >
                    <span class="candidate-avatar candidate-avatar-fallback" aria-hidden="true">
                      {{ (r.name || '?').slice(0, 1) }}
                    </span>
                    <span class="candidate-name-native">{{ r.name }}</span>
                  </li>
                </template>
                <template v-if="showPopularStudios && popularStudiosFiltered.length > 0">
                  <li class="candidate-section-label">人気の制作会社</li>
                  <li
                    v-for="st in popularStudiosFiltered"
                    :key="`pop-${st.id}`"
                    class="candidate-item"
                    role="option"
                    :aria-selected="false"
                    @mousedown.prevent
                    @click="selectStudio(st)"
                  >
                    <span class="candidate-avatar candidate-avatar-fallback" aria-hidden="true">
                      {{ (st.name || '?').slice(0, 1) }}
                    </span>
                    <span class="candidate-name-native">{{ st.name }}</span>
                    <span v-if="st.isAnimationStudio" class="occupation-tag">制作会社</span>
                  </li>
                </template>
              </template>

              <template v-else>
                <li v-if="searchLoading" class="candidate-status">検索中…</li>
                <li v-else-if="searchError" class="candidate-status is-error">{{ searchError }}</li>

                <!-- 制作会社モード: スタジオ候補 -->
                <template v-else-if="searchMode === 'studio'">
                  <li v-if="studioCandidates.length === 0" class="candidate-status">
                    {{ studioHint || '該当する制作会社が見つかりませんでした。' }}
                  </li>
                  <li
                    v-for="(st, i) in studioCandidates"
                    :id="`cand-${st.id}`"
                    :key="st.id"
                    class="candidate-item"
                    role="option"
                    :aria-selected="false"
                    :class="{ 'is-active': i === activeIndex }"
                    @mouseenter="activeIndex = i"
                    @mousedown.prevent
                    @click="selectStudio(st)"
                  >
                    <span class="candidate-avatar candidate-avatar-fallback" aria-hidden="true">
                      {{ (st.name || '?').slice(0, 1) }}
                    </span>
                    <span class="candidate-name-native">{{ st.name }}</span>
                    <span v-if="st.isAnimationStudio" class="occupation-tag">制作会社</span>
                  </li>
                </template>

                <!-- 作品名モード: 作品候補 -->
                <template v-else-if="searchMode === 'title'">
                  <li v-if="mediaCandidates.length === 0" class="candidate-status">
                    該当する作品が見つかりませんでした。
                  </li>
                  <li
                    v-for="(media, i) in mediaCandidates"
                    :id="`cand-${media.id}`"
                    :key="media.id"
                    class="candidate-item candidate-item-media"
                    role="option"
                    :aria-selected="false"
                    :class="{ 'is-active': i === activeIndex }"
                    @mouseenter="activeIndex = i"
                    @mousedown.prevent
                    @click="selectMediaToAuthor(media)"
                  >
                    <NuxtImg
                      v-if="media.coverImage?.medium"
                      class="candidate-cover"
                      :src="media.coverImage.medium"
                      alt=""
                      loading="lazy"
                    />
                    <span v-else class="candidate-cover candidate-cover-fallback" aria-hidden="true">?</span>
                    <span class="candidate-media-main">
                      <span class="candidate-name-native">{{ displayTitle(media.title) }}</span>
                      <span class="candidate-media-meta">{{ mediaMeta(media) }}</span>
                    </span>
                  </li>
                </template>

                <!-- 作者モード: 既存のスタッフ候補（変更なし） -->
                <template v-else>
                  <li v-if="staffCandidates.length === 0" class="candidate-status">
                    該当する作り手が見つかりませんでした。
                  </li>
                  <li
                    v-for="(staff, i) in staffCandidates"
                    :id="`cand-${staff.id}`"
                    :key="staff.id"
                    class="candidate-item"
                    role="option"
                    :aria-selected="selectedStaff?.id === staff.id"
                    :class="{ 'is-selected': selectedStaff?.id === staff.id, 'is-active': i === activeIndex }"
                    @mouseenter="activeIndex = i"
                    @mousedown.prevent
                    @click="selectStaff(staff)"
                  >
                    <NuxtImg
                      v-if="staff.image?.medium"
                      class="candidate-avatar"
                      :src="staff.image.medium"
                      alt=""
                      loading="lazy"
                    />
                    <span v-else class="candidate-avatar candidate-avatar-fallback" aria-hidden="true">
                      {{ (staff.name.native || staff.name.full || '?').slice(0, 1) }}
                    </span>
                    <span class="candidate-name-native">{{ staff.name.native || staff.name.full }}</span>
                    <span v-if="staff.name.native" class="candidate-name-full">
                      ({{ staff.name.full }})
                    </span>
                    <span v-if="staff.primaryOccupations.length > 0" class="occupation-tag">
                      {{ staff.primaryOccupations.map(o => OCCUPATION_MAP[o] ?? o).join('、') }}
                    </span>
                  </li>
                </template>
              </template>
            </ul>
          </div>

          <!-- 「最近見た」チップ（検索前のヒーロー下。控えめ・非ブロッキング・現モード別＝#1） -->
          <div v-if="!selectedStaff && !selectedStudio && mediaAuthorChoices.length === 0 && currentRecent.length > 0" class="recent-chips" :aria-label="recentLabel">
            <span class="recent-chips-label">{{ recentLabel }}</span>
            <button
              v-for="r in currentRecent"
              :key="`chip-${r.id}`"
              type="button"
              class="recent-chip"
              @click="selectRecent(r)"
            >{{ r.name }}</button>
          </div>
          <div v-if="!selectedStaff && !selectedStudio && mediaAuthorChoices.length === 0 && !currentRecent?.length" class="recent-chips sample-chips">
            <span class="recent-chips-label">試してみる</span>
            <button
              v-for="s in SAMPLE_SUGGESTIONS"
              :key="s.name"
              type="button"
              class="recent-chip"
              @click="trySample(s)"
            >{{ s.label }}</button>
          </div>
        </div>
      </div>

      <!-- 右: ヒーローイラスト（GPT image 2 生成・作り手が作品を生む情景） -->
      <div class="hero-visual" aria-hidden="true">
        <NuxtImg src="/mascot.png" alt="" class="hero-img" width="420" height="420" fetchpriority="high" format="webp" />
      </div>
    </section>

    <!-- 作品名→作者の解決メッセージ（作者なし/エラー）。選択が無くても見える（Codex#5）。 -->
    <p
      v-if="resolveNotice && !selectedStaff && !selectedStudio && mediaAuthorChoices.length === 0"
      class="status-notice resolve-notice"
    >{{ resolveNotice }}</p>

    <!-- 作品→作り手チューザ（原作/作画が複数いる作品だけ。例: ラノベの漫画化＝原作者＋漫画家） -->
    <section
      v-if="mediaAuthorChoices.length > 0 && !selectedStaff && !selectedStudio"
      class="author-chooser"
      aria-label="作り手を選ぶ"
    >
      <h2 class="author-chooser-title">「{{ mediaAuthorSourceTitle }}」の作り手</h2>
      <p class="author-chooser-sub">この作品の作り手から、たどりたい人を選んでください。</p>
      <div class="author-chooser-list">
        <button
          v-for="c in mediaAuthorChoices"
          :key="c.id"
          type="button"
          class="author-choice"
          @click="goToChoice(c)"
        >
          <span class="author-choice-role">{{ c.label }}</span>
          <span class="author-choice-name">{{ c.name.native || c.name.full }}</span>
        </button>
      </div>
    </section>

    <!-- How it works（検索前のオンボーディング＝作り手→作品→スタジオ） -->
    <section v-if="!selectedStaff && !selectedStudio && mediaAuthorChoices.length === 0" class="how" aria-label="使い方">
      <div class="how-card c-creator">
        <span class="how-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" /><path d="M14 7l3 3" /></svg>
        </span>
        <span class="how-name">作り手</span>
        <span class="how-desc">作者・監督・声優</span>
      </div>
      <span class="how-arrow" aria-hidden="true">→</span>
      <div class="how-card c-work">
        <span class="how-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5c2.5-1 5-1 8 .5C15 4 17.5 4 20 5v13c-2.5-1-5-1-8 .5C9 17 6.5 17 4 18V5z" /><path d="M12 5.5V18.5" /></svg>
        </span>
        <span class="how-name">作品</span>
        <span class="how-desc">漫画・アニメを一覧</span>
      </div>
      <span class="how-arrow" aria-hidden="true">→</span>
      <div class="how-card c-studio">
        <span class="how-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="9" width="18" height="11" rx="2" /><path d="M3 9l3-4 3.5 0-3 4M9.5 9l3-4 3.5 0-3 4" /></svg>
        </span>
        <span class="how-name">次の一本</span>
        <span class="how-desc">評価・おすすめで発見</span>
      </div>
    </section>

    <!-- ═══ Works Section（作者/監督/声優/制作会社 共通）═══ -->
    <div v-if="selectedStaff || selectedStudio" class="works-section">
      <div class="works-head">
        <h2>
          {{ worksHeading }}
          <span v-if="worksLoading" class="works-loading-indicator"><NuxtImg src="/mascot-loading.png" alt="" class="loading-mascot" width="32" height="32" format="webp" />{{ worksLoadedCount > 0 ? `読み込み中… ${worksLoadedCount}件` : '読み込み中…' }}</span>
        </h2>
        <div v-if="(selectedStaff || selectedStudio) && !worksLoading && filteredWorks.length > 0" class="works-actions">
          <button type="button" class="share-btn" @click="copyUrl" title="URLをコピー">🔗 コピー</button>
          <button type="button" class="share-btn" @click="shareOnX">X でシェア</button>
          <button v-if="recommendations.length > 0" type="button" class="share-btn share-btn--anchor" @click="scrollToRecs">おすすめ ↓</button>
          <button v-if="collaborators.length > 0 || collabStudios.length > 0 || studioKeyStaff.length > 0" type="button" class="share-btn share-btn--anchor" @click="scrollToCollabs">コラボ ↓</button>
        </div>
        <Transition name="toast"><span v-if="copyToast" class="copy-toast">URLをコピーしました</span></Transition>
      </div>

      <p v-if="worksError" class="status-error">{{ worksError }}</p>
      <p v-if="worksNotice" class="status-notice">{{ worksNotice }}</p>

      <!-- 迷ったら（代表作への誘導＝最終目標「次に何を見るか」の即答） -->
      <button
        v-if="repWork && displayWorks.length > 1"
        type="button"
        class="pick-nudge"
        @click="scrollToWork(repWork.node.id)"
      >
        <span class="pick-nudge-label">迷ったら、まず</span>
        <span class="pick-nudge-title">{{ displayTitle(repWork.node.title) }}</span>
        <span v-if="repWork.node.averageScore != null" class="pick-nudge-score">★{{ repWork.node.averageScore }}</span>
      </button>

      <!-- コントロール: 並び順（#4）＋絞り込み＋件数 -->
      <div v-if="filteredWorks.length > 1" class="works-controls">
        <div class="sort-toggle" role="group" aria-label="並び順">
          <button
            v-for="s in SORT_TABS"
            :key="s.mode"
            type="button"
            class="sort-btn"
            :class="{ 'is-active': worksSort === s.mode }"
            @click="worksSort = s.mode"
          >{{ s.label }}</button>
        </div>
        <div class="works-controls-right">
          <button
            type="button"
            class="filter-btn"
            :class="{ 'is-active': activeFilterCount > 0 || filterPanelOpen }"
            :aria-expanded="filterPanelOpen"
            @click="toggleFilterPanel"
          >絞り込み<span v-if="activeFilterCount > 0" class="filter-count">{{ activeFilterCount }}</span></button>
          <span class="works-count">{{ displayWorks.length }}<span v-if="displayWorks.length !== filteredWorks.length">/{{ filteredWorks.length }}</span>件{{ worksHasMore ? '＋' : '' }}</span>
        </div>
      </div>

      <!-- 絞り込みパネル（デスクトップ=インライン展開 / モバイル=下からドロワー＝ネイティブ
           ポップアップでない・バックドロップ/完了で閉じる・ジャンルは複数選択） -->
      <template v-if="filterPanelOpen">
        <div class="filter-backdrop" @click="filterPanelOpen = false"></div>
        <div class="filter-panel" role="dialog" aria-label="絞り込み">
          <div class="filter-panel-head">
            <span class="filter-panel-title">絞り込み</span>
            <button type="button" class="filter-clear" @click="clearFilters">条件をクリア</button>
            <button type="button" class="filter-done" @click="filterPanelOpen = false">完了</button>
          </div>

          <div v-if="roleOptions.length > 1" class="filter-group">
            <span class="filter-group-label">関わり方</span>
            <div class="filter-chips">
              <button type="button" class="filter-chip" :class="{ 'is-on': filterRole === '' }" @click="filterRole = ''">すべて</button>
              <button v-for="r in roleOptions" :key="r" type="button" class="filter-chip" :class="{ 'is-on': filterRole === r }" @click="filterRole = filterRole === r ? '' : r">{{ workRoleJp(r) }}</button>
            </div>
          </div>

          <div class="filter-group">
            <span class="filter-group-label">評価</span>
            <div class="filter-chips">
              <button v-for="n in [0, 60, 70, 80, 85]" :key="n" type="button" class="filter-chip" :class="{ 'is-on': filterMinScore === n }" @click="filterMinScore = n">{{ n === 0 ? '指定なし' : `★${n}以上` }}</button>
            </div>
          </div>

          <div v-if="genreOptions.length > 0" class="filter-group">
            <span class="filter-group-label">ジャンル<span class="filter-group-hint">（複数可）</span></span>
            <div class="filter-chips">
              <button v-for="g in genreOptions" :key="g" type="button" class="filter-chip" :class="{ 'is-on': filterGenres.has(g) }" @click="toggleGenre(g)">{{ genreJp(g) }}</button>
            </div>
          </div>

          <div v-if="formatOptions.length > 1" class="filter-group">
            <span class="filter-group-label">形態</span>
            <div class="filter-chips">
              <button type="button" class="filter-chip" :class="{ 'is-on': filterFormat === '' }" @click="filterFormat = ''">すべて</button>
              <button v-for="f in formatOptions" :key="f" type="button" class="filter-chip" :class="{ 'is-on': filterFormat === f }" @click="filterFormat = filterFormat === f ? '' : f">{{ formatJp(f) }}</button>
            </div>
          </div>

          <div v-if="statusOptions.length > 1" class="filter-group">
            <span class="filter-group-label">状態</span>
            <div class="filter-chips">
              <button type="button" class="filter-chip" :class="{ 'is-on': filterStatus === '' }" @click="filterStatus = ''">すべて</button>
              <button v-for="s in statusOptions" :key="s" type="button" class="filter-chip" :class="{ 'is-on': filterStatus === s }" @click="filterStatus = filterStatus === s ? '' : s">{{ statusJp(s) }}</button>
            </div>
          </div>

          <div class="filter-group">
            <span class="filter-group-label">既見</span>
            <div class="filter-chips">
              <button type="button" class="filter-chip" :class="{ 'is-on': filterUnseenOnly }" @click="filterUnseenOnly = !filterUnseenOnly">未見のみ表示</button>
            </div>
          </div>
        </div>
      </template>

      <!-- 統計パネル（作品数5以上で表示・折りたたみ式） -->
      <div v-if="!worksLoading && filteredWorks.length >= 5" class="stats-panel">
        <button type="button" class="stats-toggle" :aria-expanded="statsOpen" @click="statsOpen = !statsOpen">
          統計 <span class="stats-toggle-arrow">{{ statsOpen ? '▲' : '▼' }}</span>
        </button>
        <div v-if="statsOpen" class="stats-body">
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-value">{{ filteredWorks.length }}</span>
              <span class="stat-label">作品</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ statsAvgScore }}</span>
              <span class="stat-label">平均評価</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ statsYearRange }}</span>
              <span class="stat-label">活動期間</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ statsTopFormat }}</span>
              <span class="stat-label">最多形態</span>
            </div>
          </div>
          <div class="stats-bars">
            <div class="stats-bar-section">
              <span class="stats-bar-title">スコア分布</span>
              <div class="stats-bar-row" v-for="b in statsScoreBuckets" :key="b.label">
                <span class="stats-bar-label">{{ b.label }}</span>
                <div class="stats-bar-track"><div class="stats-bar-fill" :style="{ width: b.pct + '%' }"></div></div>
                <span class="stats-bar-count">{{ b.count }}</span>
              </div>
            </div>
            <div class="stats-bar-section">
              <span class="stats-bar-title">ジャンル TOP5</span>
              <div class="stats-bar-row" v-for="b in statsTopGenres" :key="b.label">
                <span class="stats-bar-label">{{ b.label }}</span>
                <div class="stats-bar-track"><div class="stats-bar-fill stats-bar-fill--genre" :style="{ width: b.pct + '%' }"></div></div>
                <span class="stats-bar-count">{{ b.count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 取得中: スケルトンで領域を予約（全件取得→確定描画まで）。これで取得中もページ高さが
           安定し、完了時に確定した並びを一発描画＝カードの並び替えリフローが起きない（issue 4）。 -->
      <div v-if="worksLoading" class="works-grid works-skeleton" aria-hidden="true">
        <div v-for="n in 12" :key="`skel-${n}`" class="skel-card">
          <div class="skel-cover"></div>
          <div class="skel-line"></div>
          <div class="skel-line skel-line-short"></div>
        </div>
      </div>

      <!-- グリッド（フィルタ→ソート済み＝displayWorks） -->
      <div v-else-if="displayWorks.length > 0" class="works-grid">
        <div
          v-for="edge in displayWorks"
          :id="`work-${edge.node.id}`"
          :key="edge.node.siteUrl"
          class="work-card"
          :class="{ 'is-seen': seenIds.has(edge.node.id), 'is-rep': repWork && edge.node.id === repWork.node.id }"
        >
          <div class="work-card-coverwrap">
            <a :href="edge.node.siteUrl" target="_blank" rel="noopener">
              <NuxtImg
                v-if="edge.node.coverImage?.medium"
                :src="edge.node.coverImage.medium"
                :alt="displayTitle(edge.node.title)"
                class="work-card-cover"
                loading="lazy"
              />
              <span v-else class="work-card-cover work-card-cover-fallback" aria-hidden="true">?</span>
            </a>
            <span v-if="repWork && edge.node.id === repWork.node.id" class="ribbon ribbon-rep">代表作</span>
            <span v-else-if="hiddenGemIds.has(edge.node.id)" class="ribbon ribbon-hidden">隠れた名作</span>
            <button
              type="button"
              class="seen-toggle"
              :class="{ 'is-seen': seenIds.has(edge.node.id) }"
              :title="seenIds.has(edge.node.id) ? '見た（クリックで解除）' : '見た/読んだにする'"
              @click="toggleSeen(edge.node.id)"
            >{{ seenIds.has(edge.node.id) ? '✓ 見た' : '見た' }}</button>
          </div>
          <div class="work-card-body">
            <a :href="edge.node.siteUrl" target="_blank" rel="noopener" class="work-card-title">{{ displayTitle(edge.node.title) }}</a>

            <!-- シグナル・チップ（★評価・形態/話数・年）＝一目で「見る価値」を判断 -->
            <div class="work-card-chips">
              <span v-if="edge.node.averageScore != null" class="chip chip-score">★{{ edge.node.averageScore }}</span>
              <span v-if="formatChip(edge.node)" class="chip chip-format">{{ formatChip(edge.node) }}</span>
              <span class="chip chip-year">{{ edge.node.startDate?.year ?? '年不明' }}</span>
            </div>

            <div v-if="edge.node.genres.length" class="work-card-genres">
              <span v-for="g in edge.node.genres.slice(0, 2)" :key="g" class="genre-tag">{{ genreJp(g) }}</span>
            </div>

            <div v-if="edge.staffRole" class="work-card-role">{{ workRoleJp(edge.staffRole) }}</div>

            <!-- 声優: 演じたキャラ -->
            <div v-if="edge.characters && edge.characters.length" class="work-card-chars">
              <span class="work-card-chars-label">役</span>
              <span v-for="c in edge.characters.slice(0, 3)" :key="c.id" class="char-tag">{{ c.name }}</span>
            </div>

            <!-- アニメ化スタジオ + アニメ視聴リンク（作者モード） -->
            <div v-if="studioBadges[edge.node.id]?.length" class="work-card-studios">
              <span class="work-card-studios-label">アニメ化</span>
              <span v-for="name in visibleStudios(edge.node.id)" :key="name" class="studio-badge">{{ name }}</span>
              <button
                v-if="studioBadges[edge.node.id].length > 2"
                type="button"
                class="studio-badge studio-badge-more"
                @click="toggleStudios(edge.node.id)"
              >{{ expandedStudios.has(edge.node.id) ? '閉じる' : '+' + (studioBadges[edge.node.id].length - 2) }}</button>
            </div>
            <div v-if="animeAdaptations(edge).length" class="work-card-anime-links">
              <a
                v-for="a in visibleAnimeAdaptations(edge)"
                :key="a.id"
                :href="a.url"
                target="_blank"
                rel="noopener"
                class="work-card-anime-link"
              >▶ {{ a.label }}</a>
              <button
                v-if="animeAdaptations(edge).length > ANIME_LINKS_COLLAPSED"
                type="button"
                class="work-card-anime-toggle"
                @click="toggleAnimeLinks(edge.node.id)"
              >{{ expandedAnimeLinks.has(edge.node.id) ? '閉じる' : `他${animeAdaptations(edge).length - ANIME_LINKS_COLLAPSED}件を表示` }}</button>
            </div>

            <a
              v-if="isReadableFormat(edge.node.format)"
              :href="purchaseLink(edge.node.title)"
              target="_blank"
              :rel="purchaseRel"
              class="work-card-buy"
            ><span v-if="affiliateActive" class="ad-badge">広告</span>Amazon で探す</a>
            <a
              v-else
              :href="`https://anilist.co/${isReadableFormat(edge.node.format) ? 'manga' : 'anime'}/${edge.node.id}`"
              target="_blank"
              rel="noopener"
              class="work-card-buy work-card-buy--anilist"
            >AniList で詳細</a>
          </div>
        </div>
      </div>

      <!-- 空表示: フィルタで全部隠れた場合と、そもそも0件を区別する -->
      <div v-else-if="!worksLoading && !worksError && filteredWorks.length > 0" class="empty-state">
        <div class="empty-state-illust" aria-hidden="true">
          <svg viewBox="0 0 120 120" fill="none">
            <circle cx="50" cy="50" r="28" stroke="#70707d" stroke-width="3" opacity="0.4"/>
            <line x1="70" y1="70" x2="95" y2="95" stroke="#70707d" stroke-width="4" stroke-linecap="round" opacity="0.4"/>
            <path d="M42 48h16M50 42v12" stroke="#ed3a8c" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
            <circle cx="95" cy="20" r="2" fill="#eff33c" opacity="0.5"/>
            <circle cx="20" cy="85" r="1.5" fill="#2dc7c0" opacity="0.5"/>
            <circle cx="105" cy="75" r="1.5" fill="#a78bfa" opacity="0.4"/>
          </svg>
        </div>
        <p class="status-empty">
          絞り込み条件に合う作品がありません。
          <button type="button" class="inline-link" @click="clearFilters">条件をクリア</button>
        </p>
      </div>
      <div v-else-if="!worksLoading && !worksError" class="empty-state">
        <div class="empty-state-illust" aria-hidden="true">
          <svg viewBox="0 0 120 120" fill="none">
            <circle cx="50" cy="50" r="28" stroke="#70707d" stroke-width="3" opacity="0.4"/>
            <line x1="70" y1="70" x2="95" y2="95" stroke="#70707d" stroke-width="4" stroke-linecap="round" opacity="0.4"/>
            <path d="M40 50h20" stroke="#ed3a8c" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
            <circle cx="95" cy="20" r="2" fill="#eff33c" opacity="0.5"/>
            <circle cx="20" cy="85" r="1.5" fill="#2dc7c0" opacity="0.5"/>
            <circle cx="105" cy="75" r="1.5" fill="#a78bfa" opacity="0.4"/>
          </svg>
        </div>
        <p class="status-empty">表示できる作品が見つかりませんでした。</p>
      </div>

      <!-- 全件取得の安全弁（25ページ）を超えた時だけ続きを取得（通常は出ない＝#5 の誤表示解消） -->
      <div v-if="worksHasMore && !worksLoading" class="load-more-wrap">
        <button type="button" class="load-more-btn" :disabled="worksLoadingMore" @click="loadMoreWorks">
          {{ worksLoadingMore ? '読み込み中…' : 'さらに読み込む' }}
        </button>
      </div>

      <!-- セクション区切り wave -->
      <div v-if="recommendations.length > 0" class="section-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none"><path d="M0,35 C240,55 480,10 720,30 C960,50 1200,15 1440,35 L1440,60 L0,60Z" fill="var(--tint-mint)"/></svg>
      </div>

      <!-- 「次に見るなら」レーン（おすすめ・代表作起点＝最終目標の直接回答） -->
      <div v-if="recommendations.length > 0" class="recs">
        <h3 class="recs-title">
          次に見るなら
          <span v-if="recsAnchorTitle" class="recs-anchor">「{{ recsAnchorTitle }}」が好きなら</span>
        </h3>
        <div class="recs-rail">
          <div
            v-for="r in recommendations"
            :key="r.id"
            class="rec-card"
          >
            <a :href="r.siteUrl" target="_blank" rel="noopener" class="rec-card-link">
              <NuxtImg v-if="r.coverImage?.medium" :src="r.coverImage.medium" :alt="displayTitle(r.title)" class="rec-cover" loading="lazy" />
              <span v-else class="rec-cover rec-cover-fallback" aria-hidden="true">?</span>
              <span class="rec-title">{{ displayTitle(r.title) }}</span>
              <span class="rec-meta">
                <span v-if="r.averageScore != null" class="rec-score">★{{ r.averageScore }}</span>
                {{ r.year ?? '' }}
              </span>
            </a>
            <button type="button" class="rec-chain-btn" title="この作品から次のおすすめを探す" @click="chainRecommendation(r)">
              さらに →
            </button>
          </div>
        </div>
      </div>

      <!-- ═══ MusicBrainz ディスコグラフィー（音楽系モード時のみ）═══ -->
      <div v-if="(mbLoading || mbReleaseGroups.length > 0 || mbError) && MUSIC_MODES.has(searchMode)" class="mb-section">
        <div class="section-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none"><path d="M0,35 C240,55 480,10 720,30 C960,50 1200,15 1440,35 L1440,60 L0,60Z" fill="var(--tint-yellow)"/></svg>
        </div>
        <div class="mb-panel">
          <button type="button" class="mb-toggle" :aria-expanded="mbOpen" @click="mbOpen = !mbOpen">
            <h3 class="mb-title">
              ディスコグラフィー
              <span v-if="mbArtist" class="mb-artist-name">{{ mbArtist.name }}</span>
              <span class="mb-badge">MusicBrainz</span>
            </h3>
            <span class="mb-toggle-arrow">{{ mbOpen ? '▲' : '▼' }}</span>
          </button>

          <div v-if="mbOpen">
            <p v-if="mbLoading" class="mb-status">
              <NuxtImg src="/mascot-loading.png" alt="" class="loading-mascot" width="24" height="24" format="webp" />
              MusicBrainz を検索中…
            </p>
            <p v-else-if="mbError" class="mb-status mb-status-error">{{ mbError }}</p>

            <template v-else-if="mbReleaseGroups.length > 0">
              <div v-for="group in mbGroupedReleases" :key="group.label" class="mb-group">
                <h4 class="mb-group-label">{{ group.label }}<span class="mb-group-count">{{ group.items.length }}</span></h4>
                <div class="mb-grid">
                  <a
                    v-for="rg in group.items"
                    :key="rg.id"
                    :href="`https://musicbrainz.org/release-group/${rg.id}`"
                    target="_blank"
                    rel="noopener"
                    class="mb-card"
                  >
                    <span class="mb-card-title">{{ rg.title }}</span>
                    <span class="mb-card-meta">
                      <span v-if="mbYear(rg)" class="mb-card-year">{{ mbYear(rg) }}</span>
                    </span>
                  </a>
                </div>
              </div>
              <p class="mb-attribution">
                Data from <a href="https://musicbrainz.org" target="_blank" rel="noopener">MusicBrainz</a>.
                Licensed under <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/" target="_blank" rel="noopener">CC BY-NC-SA 3.0</a>.
              </p>
            </template>
          </div>
        </div>
      </div>

      <!-- セクション区切り wave -->
      <div v-if="studioKeyStaff.length > 0 || collaborators.length > 0 || collabStudios.length > 0" class="section-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none"><path d="M0,35 C240,55 480,10 720,30 C960,50 1200,15 1440,35 L1440,60 L0,60Z" fill="var(--tint-lav)"/></svg>
      </div>

      <!-- よく組むクリエイター / 制作会社（スタジオモード時はロール別表示） -->
      <div v-if="studioKeyStaff.length > 0" class="collabs-section">
        <h3 class="collabs-title">この制作会社のクリエイター</h3>
        <div v-for="group in studioKeyStaff" :key="group.label" class="key-staff-group">
          <h4 class="key-staff-role-label">{{ group.label }}</h4>
          <div class="collabs-rail">
            <button
              v-for="c in group.staff"
              :key="`ks-${c.id}`"
              type="button"
              class="collab-card"
              @click="goToCollaborator(c)"
            >
              <NuxtImg v-if="c.image" :src="c.image" alt="" class="collab-avatar" loading="lazy" />
              <span v-else class="collab-avatar collab-avatar-fallback" aria-hidden="true">{{ (c.name.native || c.name.full || '?').slice(0, 1) }}</span>
              <span class="collab-name">{{ c.name.native || c.name.full }}</span>
              <span class="collab-meta">{{ c.topRole }} · {{ c.count }}作品</span>
            </button>
          </div>
        </div>
      </div>
      <div v-else-if="collaborators.length > 0 || collabStudios.length > 0" class="collabs-section">
        <div v-if="collaborators.length > 0">
          <h3 class="collabs-title">よく組むクリエイター</h3>
          <div class="collabs-rail">
            <button
              v-for="c in collaborators"
              :key="`collab-${c.id}`"
              type="button"
              class="collab-card"
              @click="goToCollaborator(c)"
            >
              <NuxtImg v-if="c.image" :src="c.image" alt="" class="collab-avatar" loading="lazy" />
              <span v-else class="collab-avatar collab-avatar-fallback" aria-hidden="true">{{ (c.name.native || c.name.full || '?').slice(0, 1) }}</span>
              <span class="collab-name">{{ c.name.native || c.name.full }}</span>
              <span class="collab-meta">{{ c.topRole }} · {{ c.count }}作品</span>
            </button>
          </div>
        </div>
        <div v-if="collabStudios.length > 0">
          <h3 class="collabs-title">よく組む制作会社</h3>
          <div class="collabs-rail">
            <button
              v-for="s in collabStudios"
              :key="`collab-studio-${s.id}`"
              type="button"
              class="collab-card collab-card-studio"
              @click="goToCollabStudio(s)"
            >
              <span class="collab-avatar collab-avatar-fallback" aria-hidden="true">{{ s.name.slice(0, 1) }}</span>
              <span class="collab-name">{{ s.name }}</span>
              <span class="collab-meta">{{ s.count }}作品</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- フッター区切り wave -->
    <div class="section-wave section-wave--footer" aria-hidden="true">
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none"><path d="M0,35 C240,55 480,10 720,30 C960,50 1200,15 1440,35 L1440,60 L0,60Z" fill="var(--tint-pink)"/></svg>
    </div>

    <footer class="site-footer">
      <div class="footer-share">
        <button type="button" class="footer-share-btn" @click="shareApp">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
          このアプリを共有
        </button>
      </div>
      <p class="footer-attribution">
        Data from
        <a href="https://anilist.co" target="_blank" rel="noopener">AniList</a>.
        本サイトは非公式の個人プロジェクトであり、AniList とは一切関係ありません。
        カバー画像は AniList の画像を直接参照（hotlink）しています。
      </p>
      <p v-if="affiliateActive" class="footer-disclosure">
        <strong>広告（アフィリエイト）について:</strong>
        当サイトは Amazon アソシエイト・プログラムの参加者です。「Amazonのアソシエイトとして、Creator Discovery は適格販売により収入を得ています。」
        作品の購入リンクには広告（アフィリエイトリンク）が含まれ、リンク経由で購入された場合に当サイトが収益を得ることがあります。
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { toRomaji, toHiragana, toKatakana } from 'wanakana'
import type {
  StaffCandidate, MediaCandidate, StudioCandidate, RecentItem, RecentKind,
  SearchMode, SortMode, RoleKey, ViewKind,
  WorkEdge, StudioWorkNode, VoiceEdge, MediaStaffEdge,
  AuthorChoice, RecItem, CollabPerson, CollabStudio, StudioNode,
  WorksController, SearchTab, SortTab,
} from '~/types'

// ── Config（R1: エンドポイントは runtimeConfig.public に一本化）─────────────
const config = useRuntimeConfig()
const route = useRoute()
const router = useRouter()

// ── Theme toggle ─────────────────────────────────────────────────────────
const isDark = ref(false)
function applyTheme(dark: boolean) {
  isDark.value = dark
  if (import.meta.client) {
    document.documentElement.classList.toggle('dark', dark)
  }
}
function toggleTheme() {
  const next = !isDark.value
  applyTheme(next)
  try { localStorage.setItem('theme', next ? 'dark' : 'light') } catch { /* Safari private */ }
}
if (import.meta.client) {
  let saved: string | null = null
  try { saved = localStorage.getItem('theme') } catch { /* Safari private */ }
  applyTheme(saved === 'dark' || (!saved && matchMedia('(prefers-color-scheme: dark)').matches))
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    let hasOverride = false
    try { hasOverride = !!localStorage.getItem('theme') } catch { /* Safari private */ }
    if (!hasOverride) applyTheme(e.matches)
  })
}
// PostHog（plugins/posthog.client.ts が provide）。key 未設定なら provide されず
// $posthog は undefined ＝ optional-chaining で全 capture が no-op になる。
const { $posthog } = useNuxtApp() as any
const ANILIST = config.public.anilistEndpoint as string
const SITE_URL = ((config.public.siteUrl as string) || '').replace(/\/$/, '')
const AFFILIATE_TAG = (config.public.affiliateTag as string) || ''
const affiliateActive = computed(() => AFFILIATE_TAG.length > 0)

// ── Composables ──────────────────────────────────────────────────────────
const { anilist } = useAniList()
const { seenIds, loadSeen, toggleSeen } = useSeen()
const { recentByKind, loadAllRecent, saveRecent } = useRecent()
const { searchArtist, getReleaseGroups } = useMusicBrainz()
import type { MBArtist, MBReleaseGroup } from '~/composables/useMusicBrainz'

// ── SEO / OGP / favicon（R2）──────────────────────────────────────────────
const SITE_TITLE = 'Creator Discovery — 作り手から、次に見る作品を見つける'
const SITE_DESC =
  '好きな作者・監督・声優・制作会社から、その作品をたどって「次に見る一本」を見つける discovery ツール。高評価順の並べ替え・絞り込み・おすすめ付き。データは AniList。'
// OGP 画像は絶対 URL が望ましい。公開ドメインが分かれば SITE_URL で絶対化する。
const OG_IMAGE = SITE_URL ? `${SITE_URL}/og-image.png` : '/og-image.png'
// JSON-LD 構造化データ（WebSite + WebApplication）。prerender で静的 HTML に焼き込まれる
// （useHead が .output/public/index.html に出力されることは実測済み）。検索エンジンが
// 「無料で使える日本語の作品 discovery ツール」と理解できるようにする。innerHTML は静的文字列
// のみ（ユーザー入力なし）＝XSS なし。値に < > & を含めない（Unhead のエスケープで壊れるため）。
const JSON_LD = SITE_URL
  ? JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          url: `${SITE_URL}/`,
          name: 'Creator Discovery',
          inLanguage: 'ja',
          description: SITE_DESC
        },
        {
          '@type': 'WebApplication',
          '@id': `${SITE_URL}/#app`,
          name: 'Creator Discovery',
          url: `${SITE_URL}/`,
          applicationCategory: 'EntertainmentApplication',
          operatingSystem: 'Web',
          browserRequirements: 'Requires JavaScript',
          inLanguage: 'ja',
          isAccessibleForFree: true,
          description: SITE_DESC,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' }
        }
      ]
    })
  : ''
useHead({
  title: SITE_TITLE,
  link: [
    ...(SITE_URL ? [{ rel: 'canonical', href: `${SITE_URL}/` }] : [])
  ],
  meta: [
    { name: 'description', content: SITE_DESC },
    { property: 'og:title', content: SITE_TITLE },
    { property: 'og:description', content: SITE_DESC },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: OG_IMAGE },
    { property: 'og:site_name', content: 'Creator Discovery' },
    { property: 'og:locale', content: 'ja_JP' },
    ...(SITE_URL ? [{ property: 'og:url', content: SITE_URL }] : []),
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: SITE_TITLE },
    { name: 'twitter:description', content: SITE_DESC },
    { name: 'twitter:image', content: OG_IMAGE }
  ],
  script: [
    ...(JSON_LD ? [{ type: 'application/ld+json', innerHTML: JSON_LD }] : [])
  ]
})

// ── AniList gateway, rate limiting, cache: composables/useAniList.ts ──────

const READABLE_FORMATS = new Set(['MANGA', 'NOVEL', 'ONE_SHOT'])
function isReadableFormat(format: string | null): boolean {
  return format != null && READABLE_FORMATS.has(format)
}

function purchaseLink(title: WorkEdge['node']['title']): string {
  const q = title.native || title.romaji || title.english || ''
  const url = `https://www.amazon.co.jp/s?k=${encodeURIComponent(q)}`
  return AFFILIATE_TAG ? `${url}&tag=${AFFILIATE_TAG}` : url
}
// アフィリエイト有効時だけ sponsored を付ける（中立時は nofollow のみ）
const purchaseRel = computed(() =>
  affiliateActive.value ? 'noopener nofollow sponsored' : 'noopener nofollow'
)

// ── Occupation filters, role matching: utils/occupations.ts ───────────────
// ── Interfaces/types: types/index.ts ─────────────────────────────────────

// State
const searchQuery = ref('')
const searchMode = ref<SearchMode>('creator')
// 主要5モード（初期表示・タブとして横並び）。「最初は作品名・作者・声優・監督・OP/ED歌手
// ぐらい」（user 2026-06-15）= 残り6モードは「もっと見る」トグルで展開する形に変更。
const SEARCH_TABS_PRIMARY: { mode: SearchMode; label: string }[] = [
  { mode: 'creator', label: '作者' },
  { mode: 'title', label: '作品名' },
  { mode: 'director', label: '監督' },
  { mode: 'voice', label: '声優' },
  { mode: 'theme-singer', label: 'OP/ED歌手' },
]
// 副モード（「もっと見る」展開で出現）。職能の専門性が高い・主要credit以外。
const SEARCH_TABS_SECONDARY: { mode: SearchMode; label: string }[] = [
  { mode: 'writing', label: '脚本' },
  { mode: 'chardesign', label: 'キャラ原案' },
  { mode: 'music', label: '劇伴' },
  { mode: 'theme-lyrics', label: '作詞' },
  { mode: 'theme-compose', label: '作曲・編曲' },
  { mode: 'studio', label: '制作会社' },
]
// モバイル用 mode-menu とその他の参照（recent 初期化や goToCollaborator）が SEARCH_TABS を
// 全件配列として参照しているので、合成版を維持する。
const SEARCH_TABS: { mode: SearchMode; label: string }[] = [...SEARCH_TABS_PRIMARY, ...SEARCH_TABS_SECONDARY]
const SECONDARY_MODES = new Set<SearchMode>(SEARCH_TABS_SECONDARY.map(t => t.mode))

const SAMPLE_SUGGESTIONS: { mode: SearchMode; name: string; label: string }[] = [
  { mode: 'creator', name: '井上雄彦', label: '井上雄彦' },
  { mode: 'director', name: '新海誠', label: '新海誠' },
  { mode: 'director', name: '山田尚子', label: '山田尚子' },
  { mode: 'voice', name: '花澤香菜', label: '花澤香菜' },
  { mode: 'voice', name: '神谷浩史', label: '神谷浩史' },
  { mode: 'music', name: '菅野よう子', label: '菅野よう子' },
  { mode: 'writing', name: '岡田麿里', label: '岡田麿里' },
  { mode: 'chardesign', name: '貞本義行', label: '貞本義行' },
  { mode: 'studio', name: 'MAPPA', label: 'MAPPA' },
  { mode: 'studio', name: '京都アニメーション', label: '京アニ' },
]

const MODE_ICONS: Record<SearchMode, string> = {
  creator: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1.5-4.5L17 4l3 3L8.5 18.5z"/><path d="M15 6l3 3"/></svg>',
  title: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5c2-1 5-1 8 .5 3-1.5 6-1.5 8-.5v13c-2-1-5-1-8 .5-3-1.5-6-1.5-8-.5z"/><path d="M12 5.5v13"/></svg>',
  director: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M2 12h20M7 2l3 5M14 2l3 5"/></svg>',
  voice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0014 0"/><path d="M12 17v4M8 21h8"/></svg>',
  'theme-singer': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 12.9a5 5 0 10-3.9-3.9"/><path d="M15 12.9l-3.9-3.9-7.5 8.6a2 2 0 102.8 2.8l8.6-7.5"/></svg>',
  writing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6"/></svg>',
  chardesign: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>',
  music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M11 18V5l10-2v13"/></svg>',
  'theme-lyrics': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z"/></svg>',
  'theme-compose': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M4 20V10M9 20V4M14 20V12M19 20V7"/></svg>',
  studio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4M9 9h0M15 9h0M9 13h0M15 13h0"/></svg>',
}
function modeIconSvg(mode: SearchMode): string { return MODE_ICONS[mode] ?? '' }
const staffCandidates = ref<StaffCandidate[]>([])
const mediaCandidates = ref<MediaCandidate[]>([])   // 作品名モードの候補
const studioCandidates = ref<StudioCandidate[]>([]) // 制作会社モードの候補
// 作品を選んだあと、その作品の作り手（原作/作画など）を出すチューザ。1人なら自動で
// 進み、複数（ラノベ→漫画化＝原作者＋漫画家 等）ならユーザーに選ばせる（#2/#3）。
const mediaAuthorChoices = ref<AuthorChoice[]>([])
const mediaAuthorSourceTitle = ref('')              // チューザ見出し用（どの作品由来か）
const selectedStaff = ref<StaffCandidate | null>(null)
// 制作会社モードで選択中のスタジオ（works-section を出すもう一つのトリガ）
const selectedStudio = ref<StudioCandidate | null>(null)
const filteredWorks = ref<WorkEdge[]>([])
// 選択中の作り手の作品が「作者作品」か「監督作品」か（見出しの出し分け＝検索タブと独立。
// 作品名チューザから監督を選んだ場合も正しく「監督作品」見出しになる）。
const selectedStaffKind = ref<'author' | 'director' | 'voice' | 'staffrole'>('author')
// staffrole（脚本・構成 / キャラ原案）モードのときの見出しラベル（'脚本・構成' 等）。
const selectedRoleLabel = ref('')
const selectedStaffRoleKey = ref<RoleKey | null>(null)
const DEFAULT_SORT: SortMode = 'score'
const SORT_TABS: { mode: SortMode; label: string }[] = [
  { mode: 'score', label: '高評価順' },
  { mode: 'pop', label: '人気順' },
  { mode: 'hidden', label: '隠れた名作' },
  { mode: 'new', label: '新しい順' },
  { mode: 'old', label: '古い順' },
]
const worksSort = ref<SortMode>(DEFAULT_SORT)
// 全ページ取得（#3/#5）: cap に達した時だけ「さらに読み込む」を出す／追加ロード中か／取得済み件数。
const worksHasMore = ref(false)
const worksLoadingMore = ref(false)
const worksLoadedCount = ref(0)

// ── フィルター（ユーザー要望: 関わり方・評価◯以上・いろんな観点）。全件ロード済みに
//    クライアント側で適用する（全ページ取得とセット＝全作品に対して効く）──────────────
const filterRole = ref('')        // 関わり方（staffRole）。''=すべて
const filterMinScore = ref(0)     // 最低評価（averageScore >= n）。0=指定なし
const filterFormat = ref('')      // 形態（TV/MOVIE/OVA…）。''=すべて
const filterStatus = ref('')      // 連載中/完結（RELEASING/FINISHED）。''=すべて
const filterGenres = ref<Set<string>>(new Set()) // ジャンル（選択のどれかを含む＝OR）
const filterUnseenOnly = ref(false) // 未見のみ（「見た/読んだ」印で既見を除外）
const filterDrawerOpen = ref(false) // モバイルのフィルタ・ドロワー開閉（ハンバーガー式）

function clearFilters() {
  filterRole.value = ''
  filterMinScore.value = 0
  filterFormat.value = ''
  filterStatus.value = ''
  filterGenres.value = new Set()
  filterUnseenOnly.value = false
}
const activeFilterCount = computed(() =>
  (filterRole.value ? 1 : 0) + (filterMinScore.value ? 1 : 0) + (filterFormat.value ? 1 : 0) +
  (filterStatus.value ? 1 : 0) + (filterGenres.value.size > 0 ? 1 : 0) + (filterUnseenOnly.value ? 1 : 0)
)
function toggleGenre(g: string) {
  const next = new Set(filterGenres.value)
  next.has(g) ? next.delete(g) : next.add(g)
  filterGenres.value = next
}

// manga node id → アニメ化した制作会社名（頻度順）
const studioBadges = ref<Record<number, string[]>>({})
// +N を押して制作会社を全件展開中の manga node id
const expandedStudios = ref<Set<number>>(new Set())

// 表示する制作会社：展開中は全件、それ以外は上位2件
function visibleStudios(id: number): string[] {
  const all = studioBadges.value[id] ?? []
  return expandedStudios.value.has(id) ? all : all.slice(0, 2)
}

function animeAdaptations(edge: WorkEdge): { id: number; url: string; label: string }[] {
  return (edge.node.relations?.edges ?? [])
    .filter(r => r.relationType === 'ADAPTATION' && r.node.type === 'ANIME')
    .map(r => {
      const t = r.node.title
      const name = t?.native || t?.romaji || ''
      const year = r.node.startDate?.year ? `${r.node.startDate.year}` : ''
      const fmt = r.node.format ? formatJp(r.node.format) : ''
      const parts = [fmt, year].filter(Boolean).join(' ')
      const label = name ? (parts ? `${name}（${parts}）` : name) : (parts || `anime/${r.node.id}`)
      return { id: r.node.id, url: `https://anilist.co/anime/${r.node.id}`, label }
    })
}

const ANIME_LINKS_COLLAPSED = 2
const expandedAnimeLinks = ref<Set<number>>(new Set())

function visibleAnimeAdaptations(edge: WorkEdge): { id: number; url: string; label: string }[] {
  const all = animeAdaptations(edge)
  return expandedAnimeLinks.value.has(edge.node.id) ? all : all.slice(0, ANIME_LINKS_COLLAPSED)
}

function toggleAnimeLinks(id: number) {
  const next = new Set(expandedAnimeLinks.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expandedAnimeLinks.value = next
}

function toggleStudios(id: number) {
  const next = new Set(expandedStudios.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expandedStudios.value = next
}

const searchError = ref('')
const searchLoading = ref(false)    // live 検索の実行中（ドロップダウンに「検索中」表示）
const dropdownOpen = ref(false)     // 候補ドロップダウンの開閉
const activeIndex = ref(-1)         // キーボードでハイライト中の候補 index（-1＝なし）
const searchInputEl = ref<HTMLInputElement | null>(null)
// aria-activedescendant 用: ハイライト中候補の DOM id（モード対応）
const activeId = computed(() => {
  const item = searchMode.value === 'title'
    ? mediaCandidates.value[activeIndex.value]
    : searchMode.value === 'studio'
      ? studioCandidates.value[activeIndex.value]
      : staffCandidates.value[activeIndex.value]
  return item ? `cand-${item.id}` : undefined
})
const worksError = ref('')
const worksNotice = ref('') // 非ブロッキングの案内（例: studio がレート上限で省略）
// 作品名→作者の解決が「作者なし/エラー」だった時の案内（選択が無くても見える独立表示）
const resolveNotice = ref('')
// 制作会社モードのドロップダウンに出す案内（日本語名は不可→ローマ字を促す 等・#2）
const studioHint = ref('')
const worksLoading = ref(false)

// Debounce state
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let requestSeq = 0
let suppressNextWatch = false // selectStaff で入力欄を書き換えた時の再検索抑止

// 検索欄のプレースホルダ（モードで切替）
const CREATOR_PLACEHOLDER = '作者名（漢字・かな・ローマ字）　例: 井上雄彦 / いのうえ / inoue'
const TITLE_PLACEHOLDER = '作品名（漫画・アニメ）　例: 進撃の巨人 / すずみや'
const DIRECTOR_PLACEHOLDER = '監督名（漢字・かな・ローマ字）　例: 新海誠 / 山田尚子'
const VOICE_PLACEHOLDER = '声優名（漢字・かな・ローマ字）　例: 花澤香菜 / はなざわ / hanazawa'
const WRITING_PLACEHOLDER = '脚本家・シリーズ構成　例: 岡田麿里 / 虚淵玄 / 吉田玲子'
const CHARDESIGN_PLACEHOLDER = 'キャラクター原案　例: 貞本義行 / 田中将賀 / いとうのいぢ'
const MUSIC_PLACEHOLDER = '音楽担当　例: 澤野弘之 / 神前暁 / 梶浦由記'
const THEME_SINGER_PLACEHOLDER = 'OP/ED 歌手　例: LiSA / Ado / YOASOBI / 鈴木雅之'
const THEME_LYRICS_PLACEHOLDER = '作詞家　例: 畑亜貴 / 秋元康'
const THEME_COMPOSE_PLACEHOLDER = '作曲・編曲　例: 神前暁 / ryo / 田中秀和'
const STUDIO_PLACEHOLDER = '制作会社（アニメスタジオ）　例: MAPPA / ufotable / 京都アニメーション'
const searchPlaceholder = computed(() =>
  searchMode.value === 'title' ? TITLE_PLACEHOLDER
    : searchMode.value === 'director' ? DIRECTOR_PLACEHOLDER
    : searchMode.value === 'voice' ? VOICE_PLACEHOLDER
    : searchMode.value === 'writing' ? WRITING_PLACEHOLDER
    : searchMode.value === 'chardesign' ? CHARDESIGN_PLACEHOLDER
    : searchMode.value === 'music' ? MUSIC_PLACEHOLDER
    : searchMode.value === 'theme-singer' ? THEME_SINGER_PLACEHOLDER
    : searchMode.value === 'theme-lyrics' ? THEME_LYRICS_PLACEHOLDER
    : searchMode.value === 'theme-compose' ? THEME_COMPOSE_PLACEHOLDER
    : searchMode.value === 'studio' ? STUDIO_PLACEHOLDER
    : CREATOR_PLACEHOLDER
)

// 現在モードの recent リストとラベル（searchMode は RecentKind と同じ集合）。
// null 安全: モードを足したのに recent 配線（recentByKind / RECENT_KEYS / loadAllRecent）を
// 忘れると undefined.length で全体が白画面化する（実際に creative タブで踏んだ＝2026-06-15）。
// 欠けても空リストへ畳んでアプリは生かす。
const currentRecent = computed<RecentItem[]>(() => recentByKind.value[searchMode.value] ?? [])
const recentLabel = computed(() => RECENT_LABELS[searchMode.value])
const hasAnyRecent = computed(() => Object.values(recentByKind.value).some(list => list.length > 0))

// 入力が空でフォーカス中、かつ現モードの最近見たがあればドロップダウンに recent を出す。
const showRecent = computed(() =>
  dropdownOpen.value && searchQuery.value.trim().length === 0 &&
  currentRecent.value.length > 0
)

// 作品セクション見出しの接尾辞（監督作品なら「の監督作品」）。検索タブではなく
// selectedStaffKind を見る＝作品名チューザから監督を選んでも正しく出る。
const staffWorksSuffix = computed(() =>
  selectedStaffKind.value === 'director' ? ' の監督作品'
    : selectedStaffKind.value === 'voice' ? ' の出演作'
    : selectedStaffKind.value === 'staffrole' ? ` の${selectedRoleLabel.value}担当作`
    : ' の作品'
)

// ── UI 状態: モバイルのモードメニュー（ハンバーガー）／絞り込みパネル ─────────────────
const modeMenuOpen = ref(false)    // 狭い画面のモード選択メニュー（タップで開閉・選択で自動クローズ）
const filterPanelOpen = ref(false) // 絞り込みパネル（デスクトップ=インライン / モバイル=ドロワー）
// 副6モードの展開状態（user 2026-06-15）。直接タブから副モードを選んでいる状態（共有URL・
// recent 再選択など）で副タブが隠れていると現在地が見えなくなるので、副に入った瞬間に
// auto-open する。閉じるのはユーザー操作（もっと見るボタン）のみ。
const moreTabsOpen = ref(false)
watch(searchMode, (m) => {
  if (SECONDARY_MODES.has(m)) moreTabsOpen.value = true
}, { immediate: true })
const currentModeLabel = computed(() => SEARCH_TABS.find(t => t.mode === searchMode.value)?.label ?? '')
function onPickMode(mode: SearchMode) {
  modeMenuOpen.value = false       // 選んだら自動で閉じる（ユーザー要望）
  setSearchMode(mode)
}
function toggleFilterPanel() { filterPanelOpen.value = !filterPanelOpen.value }

// 作品セクションの見出し（作者/監督/声優は名前＋接尾辞、制作会社は「◯◯ の制作作品」）。
const worksHeading = computed(() => {
  if (selectedStudio.value) return `${selectedStudio.value.name} の制作作品`
  if (selectedStaff.value) return `${selectedStaff.value.name.native || selectedStaff.value.name.full}${staffWorksSuffix.value}`
  return ''
})

// 「迷ったら」から代表作カードへスクロール（その作品を見える位置へ）。
function scrollToWork(id: number) {
  if (typeof document === 'undefined') return
  document.getElementById(`work-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

// ── Labels, formatting: utils/labels.ts ──────────────────────────────────

// ── フィルタの選択肢（ロード済み作品に実在する値だけ＝空振りしない）──────────────────
const roleOptions = computed(() => {
  const s = new Set<string>()
  for (const e of filteredWorks.value) if (e.staffRole) s.add(e.staffRole)
  return [...s]
})
const genreOptions = computed(() => {
  const s = new Set<string>()
  for (const e of filteredWorks.value) for (const g of e.node.genres) s.add(g)
  return [...s].sort()
})
const formatOptions = computed(() => {
  const s = new Set<string>()
  for (const e of filteredWorks.value) if (e.node.format) s.add(e.node.format)
  return [...s]
})
const statusOptions = computed(() => {
  const s = new Set<string>()
  for (const e of filteredWorks.value) if (e.node.status) s.add(e.node.status)
  return [...s]
})

// ── 統計パネル ──────────────────────────────────────────────
const statsOpen = ref(false)
const statsAvgScore = computed(() => {
  const scores = filteredWorks.value.map(e => e.node.averageScore).filter((s): s is number => s != null)
  if (scores.length === 0) return '—'
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
})
const statsYearRange = computed(() => {
  const years = filteredWorks.value.map(e => e.node.startDate?.year).filter((y): y is number => y != null)
  if (years.length === 0) return '—'
  const min = Math.min(...years), max = Math.max(...years)
  return min === max ? `${min}` : `${min}–${max}`
})
const statsTopFormat = computed(() => {
  const counts = new Map<string, number>()
  for (const e of filteredWorks.value) {
    const f = e.node.format
    if (f) counts.set(f, (counts.get(f) ?? 0) + 1)
  }
  if (counts.size === 0) return '—'
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  return formatJp(top[0])
})
const statsScoreBuckets = computed(() => {
  const buckets = [
    { label: '90+', min: 90, max: 101, count: 0 },
    { label: '80–89', min: 80, max: 90, count: 0 },
    { label: '70–79', min: 70, max: 80, count: 0 },
    { label: '60–69', min: 60, max: 70, count: 0 },
    { label: '–59', min: 0, max: 60, count: 0 },
  ]
  for (const e of filteredWorks.value) {
    const s = e.node.averageScore
    if (s == null) continue
    for (const b of buckets) { if (s >= b.min && s < b.max) { b.count++; break } }
  }
  const max = Math.max(...buckets.map(b => b.count), 1)
  return buckets.map(b => ({ ...b, pct: (b.count / max) * 100 }))
})
const statsTopGenres = computed(() => {
  const counts = new Map<string, number>()
  for (const e of filteredWorks.value) for (const g of e.node.genres) counts.set(g, (counts.get(g) ?? 0) + 1)
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const max = sorted.length > 0 ? sorted[0][1] : 1
  return sorted.map(([g, c]) => ({ label: genreJp(g), count: c, pct: (c / max) * 100 }))
})

// ── MusicBrainz ディスコグラフィー ──────────────────────────────────────
const mbArtist = ref<MBArtist | null>(null)
const mbReleaseGroups = ref<MBReleaseGroup[]>([])
const mbLoading = ref(false)
const mbError = ref('')
const mbOpen = ref(true)

const MUSIC_MODES = new Set<SearchMode>(['music', 'theme-singer', 'theme-lyrics', 'theme-compose'])

const MB_TYPE_JP: Record<string, string> = {
  Album: 'アルバム', Single: 'シングル', EP: 'EP', Broadcast: '放送', Other: 'その他',
}
const MB_SECONDARY_JP: Record<string, string> = {
  Soundtrack: 'サントラ', Compilation: 'ベスト', Live: 'ライブ', Remix: 'リミックス',
  'DJ-mix': 'DJ MIX', Mixtape: 'ミックステープ', Demo: 'デモ', 'Field recording': 'フィールド',
  'Audio drama': 'ドラマCD', Audiobook: 'オーディオブック', Interview: 'インタビュー',
  Spokenword: 'スポークンワード',
}
function mbTypeLabel(rg: MBReleaseGroup): string {
  const sec = rg['secondary-types']
  if (sec && sec.length > 0) {
    const jp = sec.map(s => MB_SECONDARY_JP[s] ?? s).join('/')
    return jp
  }
  return MB_TYPE_JP[rg['primary-type'] ?? ''] ?? rg['primary-type'] ?? ''
}
function mbYear(rg: MBReleaseGroup): string {
  return rg['first-release-date']?.slice(0, 4) ?? ''
}

const mbGroupedReleases = computed(() => {
  const groups = new Map<string, MBReleaseGroup[]>()
  const order = ['Album', 'Single', 'EP', 'Soundtrack', 'Compilation', 'Live', 'Other']
  for (const rg of mbReleaseGroups.value) {
    const sec = rg['secondary-types']
    const key = (sec && sec.length > 0) ? sec[0] : (rg['primary-type'] ?? 'Other')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(rg)
  }
  for (const [, list] of groups) {
    list.sort((a, b) => (b['first-release-date'] ?? '').localeCompare(a['first-release-date'] ?? ''))
  }
  return [...groups.entries()]
    .sort((a, b) => {
      const ai = order.indexOf(a[0]), bi = order.indexOf(b[0])
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi)
    })
    .map(([key, list]) => ({ label: MB_SECONDARY_JP[key] ?? MB_TYPE_JP[key] ?? key, items: list }))
})

function clearMusicBrainz() {
  mbArtist.value = null
  mbReleaseGroups.value = []
  mbLoading.value = false
  mbError.value = ''
}

async function loadMusicBrainz(staffName: { full: string; native: string | null }) {
  clearMusicBrainz()
  mbLoading.value = true
  try {
    const searchName = staffName.full || staffName.native || ''
    if (!searchName) return
    const artist = await searchArtist(searchName)
    if (!artist) {
      if (staffName.native && staffName.native !== staffName.full) {
        const alt = await searchArtist(staffName.native)
        if (alt) {
          mbArtist.value = alt
          const rgs = await getReleaseGroups(alt.id, 200)
          mbReleaseGroups.value = rgs
          return
        }
      }
      return
    }
    mbArtist.value = artist
    const rgs = await getReleaseGroups(artist.id, 200)
    mbReleaseGroups.value = rgs
  } catch (e) {
    mbError.value = 'MusicBrainz の読み込みに失敗しました。'
  } finally {
    mbLoading.value = false
  }
}

// ── 表示パイプライン: フィルタ → ソート、および 代表作 / 隠れた名作の導出 ───────────
function passesFilters(e: WorkEdge): boolean {
  if (filterRole.value && e.staffRole !== filterRole.value) return false
  if (filterMinScore.value && (e.node.averageScore ?? 0) < filterMinScore.value) return false
  if (filterFormat.value && e.node.format !== filterFormat.value) return false
  if (filterStatus.value && e.node.status !== filterStatus.value) return false
  if (filterGenres.value.size && !e.node.genres.some(g => filterGenres.value.has(g))) return false
  if (filterUnseenOnly.value && seenIds.value.has(e.node.id)) return false
  return true
}
const filteredForDisplay = computed<WorkEdge[]>(() => filteredWorks.value.filter(passesFilters))

const maxPopularity = computed(() => {
  let m = 0
  for (const e of filteredForDisplay.value) m = Math.max(m, e.node.popularity ?? 0)
  return m || 1
})

// フィルタ後を並べ替える。null（評価/人気/年 不明）は常に末尾。元配列は触らない。
const displayWorks = computed<WorkEdge[]>(() => {
  const arr = filteredForDisplay.value.slice()
  const yr = (e: WorkEdge) => e.node.startDate?.year ?? null
  const sc = (e: WorkEdge) => e.node.averageScore ?? null
  const pp = (e: WorkEdge) => e.node.popularity ?? null
  const cmp = (a: number | null, b: number | null, dir: number) => {
    if (a === null && b === null) return 0
    if (a === null) return 1
    if (b === null) return -1
    return (b - a) * dir // dir=1 → 降順 / dir=-1 → 昇順
  }
  const maxPop = maxPopularity.value
  const hiddenScore = (e: WorkEdge) =>
    (e.node.averageScore ?? 0) - 14 * ((e.node.popularity ?? 0) / maxPop)
  arr.sort((a, b) => {
    switch (worksSort.value) {
      case 'score': return cmp(sc(a), sc(b), 1)
      case 'pop': return cmp(pp(a), pp(b), 1)
      case 'new': return cmp(yr(a), yr(b), 1)
      case 'old': return cmp(yr(a), yr(b), -1)
      case 'hidden': return hiddenScore(b) - hiddenScore(a)
      default: return 0
    }
  })
  return arr
})

// 代表作（迷ったら最初の1作）: 評価を主軸に人気を最大8点ぶん加点した「旗艦」を1つ選ぶ
// （無名の高評価短編より定番が勝つ）。フィルタ後の集合から選ぶ＝今見ている範囲の最有力。
const repWork = computed<WorkEdge | null>(() => {
  let best: WorkEdge | null = null
  let bestKey = -Infinity
  const maxPop = maxPopularity.value
  for (const e of filteredForDisplay.value) {
    if (e.node.averageScore == null) continue
    const key = e.node.averageScore + 8 * ((e.node.popularity ?? 0) / maxPop)
    if (key > bestKey) { bestKey = key; best = e }
  }
  return best
})

// 隠れた名作: 高評価（≥78）＋相対的に控えめ（最大人気の25%未満）＋絶対的にニッチ（5万未満）。
const HIDDEN_GEM_POP_CAP = 50000
const hiddenGemIds = computed<Set<number>>(() => {
  const maxPop = maxPopularity.value
  const ids = new Set<number>()
  for (const e of filteredForDisplay.value) {
    const pop = e.node.popularity ?? 0
    if ((e.node.averageScore ?? 0) >= 78 && pop < 0.25 * maxPop && pop < HIDDEN_GEM_POP_CAP) ids.add(e.node.id)
  }
  return ids
})

// ── Recent items: composables/useRecent.ts ───────────────────────────────
// ── 候補ドロップダウン: 開閉・キーボード操作・外クリック ──────────────────────

// v-model は IME 変換確定（Enter）まで値を同期しない＝「打っている途中」では候補が
// 出なかった。input イベントを直接拾うことで、変換中（確定前）でも1文字ごとに
// searchQuery を更新し、Google のように打っているそばから候補を出す。
function onInput(e: Event) {
  searchQuery.value = (e.target as HTMLInputElement).value
}

function closeDropdown() {
  dropdownOpen.value = false
  activeIndex.value = -1
}

// 入力欄に戻ってきた時、候補が残っていれば再表示する。
// 入力が空でも「最近見た作者」があればドロップダウンを開いて recent を見せる。
function onFocus() {
  const len = searchQuery.value.trim().length
  if (len === 0 && (currentRecent.value.length > 0 || (searchMode.value === 'studio' && popularStudios.value.length > 0))) {
    dropdownOpen.value = true
    return
  }
  const candCount = searchMode.value === 'title'
    ? mediaCandidates.value.length
    : searchMode.value === 'studio'
      ? studioCandidates.value.length
      : staffCandidates.value.length
  if (candCount > 0 && len >= 2) {
    dropdownOpen.value = true
  }
}

// 上下キーでハイライトを循環移動し、画面外なら見える位置へスクロール
function moveActive(delta: number) {
  const list: { id: number }[] = searchMode.value === 'title'
    ? mediaCandidates.value
    : searchMode.value === 'studio'
      ? studioCandidates.value
      : staffCandidates.value
  const n = list.length
  if (!dropdownOpen.value || n === 0) return
  activeIndex.value = (activeIndex.value + delta + n) % n
  nextTick(() => {
    const item = list[activeIndex.value]
    if (item) document.getElementById(`cand-${item.id}`)?.scrollIntoView({ block: 'nearest' })
  })
}

// Enter: ハイライト中の候補があれば選択、無ければ検索を実行
function onEnter() {
  if (searchMode.value === 'title') {
    const m = mediaCandidates.value[activeIndex.value]
    if (dropdownOpen.value && m) {
      selectMediaToAuthor(m)
      return
    }
    searchStaff()
    return
  }
  if (searchMode.value === 'studio') {
    const st = studioCandidates.value[activeIndex.value]
    if (dropdownOpen.value && st) {
      selectStudio(st)
      return
    }
    searchStaff()
    return
  }
  const s = staffCandidates.value[activeIndex.value]
  if (dropdownOpen.value && s) {
    selectStaff(s)
    return
  }
  searchStaff()
}

// IME 変換中（isComposing）はキー操作を無視する＝変換確定の Enter で誤検索しない定石。
function onKeydown(e: KeyboardEvent) {
  if (e.isComposing) return
  switch (e.key) {
    case 'ArrowDown': e.preventDefault(); moveActive(1); break
    case 'ArrowUp': e.preventDefault(); moveActive(-1); break
    case 'Enter': e.preventDefault(); onEnter(); break
    case 'Escape': closeDropdown(); break
  }
}

// ドロップダウン外のクリックで閉じる（client-side のみ）
function onDocClick(e: MouseEvent) {
  const target = e.target as Node
  const box = searchInputEl.value?.closest('.search-box')
  if (box && !box.contains(target)) closeDropdown()
  // モバイルのモードメニューも外クリックで閉じる
  if (modeMenuOpen.value && !(target as HTMLElement)?.closest?.('.mode-menu')) {
    modeMenuOpen.value = false
  }
}

// プログラムから検索欄を書き換える時、再検索 watch を1回だけ抑止する。
// 値が変わらない時は何もしない（抑止フラグの漏れ＝次の入力が無視される事故を防ぐ）。
function setQuerySilently(v: string) {
  if (searchQuery.value === v) return
  suppressNextWatch = true
  searchQuery.value = v
}

// 候補/最近見たを「選択」したら、未発火の debounce 検索を取り消し、進行中の検索
// レスポンスも無効化する。これをしないと、選択直後に遅れて発火/到着した検索が
// 候補リストとドロップダウンを開き直し、選んだ選択を上書きしてしまう（レビュー指摘#3）。
function cancelPendingSearch() {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  requestSeq++ // 進行中の executeSearch/executeStudioSearch の応答を stale 化
  searchLoading.value = false
}

// ── URL 状態（全モード共有・リロード/戻る/直リンク復元）────────────────────────────
// URL は ?view=<種別>&id=<数値> に統一する。種別の英語:
//   creator(作者) / director(監督) / voice(声優) / writing(脚本・構成) /
//   chardesign(キャラ原案) / creative(脚本・原案タブ) / studio(制作会社)
// 旧 ?staff=ID（=作者）/ ?studio=ID も後方互換で読む（既存の共有リンクを壊さない）。

// 現在の選択を view 種別へ写像（復元の二重ロード判定に使う）。
function currentViewKind(): ViewKind | '' {
  if (selectedStudio.value) return 'studio'
  if (!selectedStaff.value) return ''
  const k = selectedStaffKind.value
  if (k === 'director') return 'director'
  if (k === 'voice') return 'voice'
  if (k === 'staffrole') return selectedStaffRoleKey.value ?? 'writing'
  return 'creator' // author
}

// 選択時に URL を載せる（各 load 関数から呼ぶ＝唯一の出口）。既に同じ view+id なら何もしない
// ＝復元（URL→load）でこれが呼ばれても push し直さない＝ループ防止。
function pushView(view: ViewKind, id: number) {
  if (String(route.query.view ?? '') === view && String(route.query.id ?? '') === String(id)) return
  router.push({ query: { view, id: String(id) } })
}

// URL（?view&id、無ければ旧 ?staff/?studio）から選択を復元。push はしない（各 load の
// pushView がガード付きで担う）。onMounted・戻る/進む・直リンク・リロードで共通に使う。
function restoreFromQuery() {
  const q = route.query
  let view = String(q.view ?? '') as ViewKind | ''
  let id = parseInt(String(q.id ?? ''), 10)
  if (!view) { // 後方互換: 旧 ?studio=ID（制作会社）/ ?staff=ID（作者）
    const ls = parseInt(String(q.studio ?? ''), 10)
    const lt = parseInt(String(q.staff ?? ''), 10)
    if (Number.isFinite(ls)) { view = 'studio'; id = ls }
    else if (Number.isFinite(lt)) { view = 'creator'; id = lt }
  }
  if (!view || !Number.isFinite(id)) {
    // クエリが空 → 選択中なら解除（戻るで検索画面へ）
    if (selectedStaff.value || selectedStudio.value) { clearSelection(); setQuerySilently('') }
    return
  }
  // 既に同じビューを表示中なら何もしない（自分の push・戻る/進むの二重ロード防止）
  const curId = selectedStudio.value?.id ?? selectedStaff.value?.id ?? null
  if (curId === id && currentViewKind() === view) return
  // タブのハイライトを URL に合わせる（検索欄/作品ロードは各 select* が処理）。
  // 旧 ?view=creative（脚本・原案の統合ビュー＝既存の共有リンク）は「脚本」タブに寄せる
  // （作品は selectStaffRoleById(id,'creative') が従来どおり統合表示する＝リンクは壊れない）。
  const MODE_MAP: Record<string, SearchMode> = {
    studio: 'studio', director: 'director', voice: 'voice', creator: 'creator',
    chardesign: 'chardesign', music: 'music',
    'theme-singer': 'theme-singer', 'theme-lyrics': 'theme-lyrics', 'theme-compose': 'theme-compose',
  }
  searchMode.value = MODE_MAP[view] ?? 'writing'
  if (view === 'studio') selectStudioById(id)
  else if (view === 'director') selectDirectorById(id, '')
  else if (view === 'voice') selectVoiceById(id, '')
  else if (view === 'creator') selectStaffById(id)
  else selectStaffRoleById(id, '', view as RoleKey)
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  // 最近見た（全モード）＋「見た/読んだ」印を localStorage から復元（client のみ）
  loadAllRecent()
  loadSeen()
  void fetchPopularStudios()
  // 共有 URL / リロードで直接開かれたら復元（全モード対応）。
  restoreFromQuery()
})
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

// 戻る/進む・リロードで URL（?view/?id、旧 ?staff/?studio）が変わったら追従する。
watch(() => [route.query.view, route.query.id, route.query.staff, route.query.studio], restoreFromQuery)

// Query 1: Staff search (immediate — Enter / button)
async function searchStaff() {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  await executeSearch()
}

function trySample(s: typeof SAMPLE_SUGGESTIONS[0]) {
  searchMode.value = s.mode
  if (SECONDARY_MODES.has(s.mode)) moreTabsOpen.value = true
  setQuerySilently(s.name)
  searchStaff()
}

// Live search: debounced watch
watch(searchQuery, (newVal) => {
  // selectStaff が入力欄に名前を入れた直後は再検索しない
  if (suppressNextWatch) {
    suppressNextWatch = false
    return
  }
  resolveNotice.value = '' // 入力が変われば古い「作者なし」案内は消す（Codex#5）
  if (debounceTimer !== null) clearTimeout(debounceTimer)
  if (newVal.trim().length < 2) {
    // 入力が短い場合は候補をクリア。空なら recent を見せるためドロップダウンは
    // 開いたままにし、それ以外（1文字）は閉じる。
    // 進行中の検索レスポンスを無効化（クリア後に stale 候補が戻らないように＝Codex#2）。
    requestSeq++
    staffCandidates.value = []
    mediaCandidates.value = []
    studioCandidates.value = []
    searchError.value = ''
    studioHint.value = ''
    searchLoading.value = false
    if (newVal.trim().length === 0 && (currentRecent.value.length > 0 || (searchMode.value === 'studio' && popularStudios.value.length > 0))) {
      dropdownOpen.value = true
      activeIndex.value = -1
    } else {
      closeDropdown()
    }
    return
  }
  // 入力中はすぐドロップダウンを開いて「検索中」を見せる（体感速度）
  dropdownOpen.value = true
  searchLoading.value = true
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    executeSearch()
  }, 300)
})

// 1 表記ぶんの検索。失敗しても [] を返してマージを止めない（キャッシュ/間隔は anilist() が担当）。
// 429（レート上限）だけは握り潰さず呼び出し側へ伝える。
async function fetchStaff(term: string): Promise<{ staff: StaffCandidate[]; rateLimited: boolean; errored: boolean }> {
  try {
    const data = await anilist<{ data: { Page: { staff: StaffCandidate[] } } }>(SEARCH_QUERY, { s: term })
    return { staff: data?.data?.Page?.staff ?? [], rateLimited: false, errored: false }
  } catch (e) {
    // 429 とハード失敗（GraphQL/ネットワーク）を区別＝呼び出し側が「見つからない」と
    // 取り違えず、再試行を促せるように（Codex#5）。
    return { staff: [], rateLimited: isRateLimited(e), errored: !isRateLimited(e) }
  }
}

// 1 表記ぶんの作品検索。失敗しても [] を返してマージを止めない。429 だけは伝える。
async function fetchMedia(term: string): Promise<{ media: MediaCandidate[]; rateLimited: boolean; errored: boolean }> {
  try {
    const data = await anilist<{ data: { Page: { media: MediaCandidate[] } } }>(TITLE_SEARCH_QUERY, { s: term })
    return { media: data?.data?.Page?.media ?? [], rateLimited: false, errored: false }
  } catch (e) {
    return { media: [], rateLimited: isRateLimited(e), errored: !isRateLimited(e) }
  }
}

async function executeSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  // 作品名・制作会社モードは別パス。作者モードは下の既存ロジック。
  if (searchMode.value === 'title') {
    await executeTitleSearch(q)
    return
  }
  if (searchMode.value === 'studio') {
    await executeStudioSearch(q)
    return
  }
  dropdownOpen.value = true
  searchLoading.value = true

  // 検索バリアント: AniList はかな→漢字も ひらがな↔カタカナ も変換しないので、
  // 複数表記を投げて id で統合する:
  //  - 生入力（その表記の native にヒット。例 ひらがな名「かきふらい」）
  //  - ひら/カナ変換（カタカナ入力→ひらがな native。例 カキフライ→かきふらい）
  //  - ローマ字（漢字 native を読みで拾う。例 いのうえ→inoue→井上雄彦）
  const hasKana = /[぀-ヿ]/.test(q)
  const hasKanji = /[一-鿿]/.test(q)
  // 純かな（漢字なし）のときだけ romaji を足す。漢字混じりに toRomaji を当てると
  // "進撃no巨人" のようなノイズ語になり1リクエストを無駄にする（title 検索と同じ判断・#4関連）。
  const terms = hasKana
    ? (hasKanji
        ? [...new Set([q, toHiragana(q), toKatakana(q)])]
        : [...new Set([q, toHiragana(q), toKatakana(q), toRomaji(q)])])
    : [q]

  searchError.value = ''
  staffCandidates.value = []
  mediaCandidates.value = []
  studioCandidates.value = []
  mediaAuthorChoices.value = []
  selectedStaff.value = null
  selectedStudio.value = null
  filteredWorks.value = []

  // stale レスポンス対策: このリクエストの連番を記録
  const mySeq = ++requestSeq
  // 新しい検索が始まったら、前の選択の作品/バッジ/おすすめロードも stale 化する
  // （クラスC: 検索中に前の作者の studio バッジ/おすすめ/通知が後から降ってこないように）。
  if (worksCtl) selectSeq++

  const batches = await Promise.all(terms.map(fetchStaff))

  // 古いレスポンスは捨てる
  if (mySeq !== requestSeq) return
  searchLoading.value = false
  activeIndex.value = -1

  const anyRateLimited = batches.some(b => b.rateLimited)
  const anyErrored = batches.some(b => b.errored) // ハード失敗（Codex#5）

  // id で重複排除して統合
  const byId = new Map<number, StaffCandidate>()
  for (const batch of batches) {
    for (const s of batch.staff) if (!byId.has(s.id)) byId.set(s.id, s)
  }

  // ── (A) Filter + Sort ──────────────────────────────────────────────────────
  // queryForms: 検索に使った全 term を小文字化
  const queryForms = terms.map(t => t.toLowerCase())

  const filtered = [...byId.values()].filter((c, _idx) => {
    // relevance: いずれかの term が name (native + full) に部分一致
    const fullName = ((c.name.native ?? '') + ' ' + (c.name.full ?? '')).toLowerCase()
    const isRelevant = queryForms.some(qf => {
      const toks = qf.split(/\s+/).filter(Boolean)
      if (toks.length === 0) return false
      // 順方向: クエリの全トークンが候補名に部分一致（語順非依存・既存）。
      if (toks.every(tok => fullName.includes(tok))) return true
      // 逆方向（#5）: 候補のローマ字 full の各トークンがクエリ語に含まれる。フルネームを
      // かなで打つと toRomaji が空白なし・姓名逆順（"kotobukiminako"）になるが、
      // full="minako kotobuki" の minako/kotobuki が qf に含まれれば一致とみなす。
      // 名トークン（2文字以上＝"Ai" のような短い名も拾う・Codex#3）。逆方向一致は多トークン名
      // （姓＋名）だけに適用＝1語名がクエリの部分文字列にたまたま含まれる誤ヒットを防ぎつつ
      // （レビュー#6）、短い名を含む二語名（例 Ai Yazawa / やざわあい）も救う。
      const fullToks = (c.name.full ?? '').toLowerCase().split(/\s+/).filter(t => t.length >= 2)
      return fullToks.length >= 2 && fullToks.every(ft => qf.includes(ft))
    })

    // 純・声優/ボーカルだけの人を除外（精密判定）。ただし声優モードでは当然残す。
    const pureVoice = searchMode.value !== 'voice' && isPureVoice(c.primaryOccupations)

    // モード別（#5）: creator=著者系・director=監督系・voice=声優系（occ 空は全モード残す）
    return isRelevant && !pureVoice && matchesSearchMode(c.primaryOccupations, searchMode.value)
  })

  // relevance rank: いずれかの term が native か full の先頭に一致 → 0、中間一致 → 1
  const withRank = filtered.map((c, idx) => {
    const native = (c.name.native ?? '').toLowerCase()
    const full = (c.name.full ?? '').toLowerCase()
    const prefixMatch = queryForms.some(qf => native.startsWith(qf) || full.startsWith(qf))
    return { c, idx, relevanceRank: prefixMatch ? 0 : 1 }
  })

  // 安定ソート: 第1=知名度（favourites 降順）、第2=occupationScore 昇順、
  // 第3=relevanceRank 昇順、第4=元 index。
  // favourites を最優先にするのが肝: AniList のかな検索は読みの前方一致で無名の人を
  // 上位に出し、ユーザーが探している有名な作り手（尾田・新海・荒木…）を埋もれさせる。
  // 知名度を第1キーにすると Google のように「有名な該当者が一番上」に揃う（実測検証済み）。
  withRank.sort((a, b) => {
    const favDiff = (b.c.favourites ?? 0) - (a.c.favourites ?? 0)
    if (favDiff !== 0) return favDiff
    const occDiff = occupationScore(a.c.primaryOccupations) - occupationScore(b.c.primaryOccupations)
    if (occDiff !== 0) return occDiff
    const relDiff = a.relevanceRank - b.relevanceRank
    if (relDiff !== 0) return relDiff
    return a.idx - b.idx
  })

  staffCandidates.value = withRank.map(({ c }) => c)
  // ──────────────────────────────────────────────────────────────────────────

  if (staffCandidates.value.length === 0) {
    if (anyRateLimited) {
      // 全表記が 429 で空なら「見つからない」ではなくレート上限を案内する
      searchError.value = RATE_LIMIT_MSG
    } else if (anyErrored) {
      // GraphQL/ネットワークのハード失敗を「見つからない」と取り違えない（Codex#5）。
      searchError.value = '検索中にエラーが発生しました。少し待ってから再試行してください。'
    } else if (hasKana && !hasKanji && q.length >= 4) {
      // フルネームをかなで打つと AniList が引けないことがある（姓名連結のローマ字が当たらない）。
      // 姓または名だけ／漢字を促す（#5: 「ことぶきみなこ」は0件でも「ことぶき」で出る）。
      searchError.value = 'フルネームのかな検索は見つからないことがあります。姓または名だけ、または漢字で試してみてください。'
    } else {
      searchError.value = '候補が見つかりませんでした。'
    }
  }

  // analytics: 検索イベント（作者モードの結果件数）
  $posthog?.capture('search', { query: q, mode: searchMode.value, results: staffCandidates.value.length })
}

// 作品名（逆引き）モードの検索本体。候補は同じドロップダウンに別レイアウトで出す。
async function executeTitleSearch(q: string) {
  dropdownOpen.value = true
  searchLoading.value = true
  searchError.value = ''
  staffCandidates.value = []
  mediaCandidates.value = []
  mediaAuthorChoices.value = []
  selectedStaff.value = null
  filteredWorks.value = []

  // AniList は ひらがな↔カタカナ も かな↔漢字 も変換しない。複数表記を投げて id で統合する。
  // 漢字を含む入力の romaji 化は "進撃no巨人" のようなノイズになるので足さない。一方、
  // 純かな入力（漢字なし）は漢字 native にもローマ字 title にも当たらない＝
  // ローマ字読みを足すと拾える（「すずみや」→"suzumiya"→ romaji "Suzumiya..." でハルヒが出る）。
  const hasKana = /[぀-ヿ]/.test(q)
  const hasKanji = /[一-鿿]/.test(q)
  const terms = hasKana
    ? (hasKanji
        ? [...new Set([q, toHiragana(q), toKatakana(q)])]
        : [...new Set([q, toHiragana(q), toKatakana(q), toRomaji(q)])])
    : [q]

  // stale レスポンス対策（作者検索と連番を共有）
  const mySeq = ++requestSeq
  if (worksCtl) selectSeq++ // 前の選択の作品/おすすめロードも stale 化（クラスC）
  const batches = await Promise.all(terms.map(fetchMedia))
  if (mySeq !== requestSeq) return
  searchLoading.value = false
  activeIndex.value = -1

  // id で統合し、popularity 降順で並べる。かな表記違いでヒットした有名作を上位へ
  // （作者検索が favourites を第1キーにするのと同じ狙い）。
  const byId = new Map<number, MediaCandidate>()
  for (const batch of batches) {
    for (const m of batch.media) if (!byId.has(m.id)) byId.set(m.id, m)
  }
  mediaCandidates.value = [...byId.values()].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))

  // 全表記が 429 で空ならレート上限を案内。ハード失敗（GraphQL/ネットワーク）は
  // 「見つからない」と取り違えずエラーを出す（Codex#5）。通常の0件は下流の表示に任せる。
  if (mediaCandidates.value.length === 0) {
    if (batches.some(b => b.rateLimited)) searchError.value = RATE_LIMIT_MSG
    else if (batches.some(b => b.errored)) searchError.value = '検索中にエラーが発生しました。少し待ってから再試行してください。'
  }

  // analytics: 検索イベント（作品名モードの結果件数）
  $posthog?.capture('search', { query: q, mode: searchMode.value, results: mediaCandidates.value.length })
}

// ── 制作会社（studio）モード ──────────────────────────────────────────────────
// 制作会社モードの検索。日本語名は別名表でローマ字根へ橋渡しし（#2）、当たらない
// 日本語入力は AniList が人気順フィラーを返すので検索せずローマ字入力を案内する。
async function executeStudioSearch(q: string) {
  // 進行中の検索を先に無効化（日本語ガードの早期 return より前に bump しないと、
  // 古い in-flight 検索が後から候補/ヒントを上書きする＝Codex#1）。
  const mySeq = ++requestSeq
  const { term, viaAlias } = resolveStudioTerm(q)
  // 別名にも当たらない日本語入力（漢字→人気順フィラー / かな→空）は AniList で検索できない。
  // 検索を走らせず、現在の選択・候補・in-flight ロードに手を付けずに案内だけ出す
  // （レビュー#1/#2: 検索が走らないのに選択を blank したり無駄に stale 化しない）。
  const termHasJa = /[぀-ヿ一-鿿]/.test(term)
  if (termHasJa && !viaAlias) {
    dropdownOpen.value = true
    searchLoading.value = false
    searchError.value = ''
    activeIndex.value = -1
    studioCandidates.value = []
    studioHint.value =
      '制作会社は英語/ローマ字名で検索してください（例: 京都アニメーション → Kyoto Animation、ほか MAPPA / ufotable / Toei）。'
    $posthog?.capture('search', { query: q, mode: searchMode.value, results: 0 })
    return
  }

  // ここから実際に検索へ進む＝状態を初期化し、前の選択の in-flight ロードを stale 化する。
  dropdownOpen.value = true
  searchLoading.value = true
  searchError.value = ''
  studioHint.value = ''
  staffCandidates.value = []
  mediaCandidates.value = []
  studioCandidates.value = []
  mediaAuthorChoices.value = []
  selectedStaff.value = null
  selectedStudio.value = null
  filteredWorks.value = []
  if (worksCtl) selectSeq++
  try {
    const data = await anilist<{ data: { Page: { studios: StudioCandidate[] } } }>(STUDIO_SEARCH_QUERY, { s: term })
    if (mySeq !== requestSeq) return
    searchLoading.value = false
    activeIndex.value = -1
    // AniList の検索関連度順をそのまま使う（ローマ字検索は実測でクリーン）。favourites で
    // 再ソートすると、たまたまヒットした有名スタジオが本命を押しのける（#1）。
    studioCandidates.value = data.data.Page.studios ?? []
    if (studioCandidates.value.length === 0) {
      studioHint.value = '該当する制作会社が見つかりませんでした。'
    }
  } catch (e) {
    if (mySeq !== requestSeq) return
    searchLoading.value = false
    activeIndex.value = -1
    studioCandidates.value = []
    if (isRateLimited(e)) searchError.value = RATE_LIMIT_MSG
    else studioHint.value = '制作会社の検索中にエラーが発生しました。少し待ってから再試行してください。'
  }

  $posthog?.capture('search', { query: q, mode: searchMode.value, results: studioCandidates.value.length })
}

// 制作会社を選択 → 主要アニメを読み込む。URL（?view=studio&id=…）は loadStudioWorks 内の pushView が載せる。
async function selectStudio(studio: StudioCandidate) {
  cancelPendingSearch()
  closeDropdown()
  searchError.value = ''
  mediaAuthorChoices.value = []
  selectedStaff.value = null
  selectedStudio.value = studio
  setQuerySilently(studio.name)
  saveRecent('studio', studio.id, studio.name) // 最近見た制作会社へ保存（#1）
  const mySeq = ++selectSeq
  $posthog?.capture('creator_viewed', { staff_id: studio.id, staff_name: studio.name, source: 'studio_search' })
  await loadStudioWorks(studio.id, mySeq)
}

// 制作会社の作品を読み込み、work-card 再利用のため WorkEdge 形へマップ（staffRole は空）。
async function loadStudioWorks(id: number, mySeq: number) {
  studioBadges.value = {}
  expandedStudios.value = new Set()
  selectedStaffKind.value = 'author'
  pushView('studio', id) // URL: ?view=studio&id=… （共有・リロード・戻る対応）
  worksCtl = {
    query: STUDIO_WORKS_QUERY,
    vars: { id },
    pick: (data) => {
      const st = data?.data?.Studio
      if (!st) return null
      // ?studio=ID 直アクセスは名前未確定なので、応答の Studio.name で確定させる。
      if (selectedStudio.value?.id === id && st.name) {
        selectedStudio.value = { ...selectedStudio.value, name: st.name }
      }
      return { items: (st.media?.nodes ?? []) as StudioWorkNode[], hasNextPage: !!st.media?.pageInfo?.hasNextPage }
    },
    // 並び順は displayWorks（ソートトグル）が担当するので transform では並べない。
    transform: (raw: StudioWorkNode[]) => raw.map(n => ({
      staffRole: '',
      node: {
        id: n.id,
        title: n.title,
        startDate: n.startDate,
        coverImage: n.coverImage,
        siteUrl: n.siteUrl,
        averageScore: n.averageScore,
        popularity: n.popularity,
        genres: n.genres ?? [],
        episodes: n.episodes,
        format: n.format,
        status: n.status,
        relations: { edges: [] }
      }
    })),
    onBatch: async (works) => { await loadCollaborators(works, null, id, mySeq) },
    seq: mySeq,
  }
  await runWorksBatch(true)
}

// URL（?studio=ID）や戻る/進む操作から制作会社を選択。名前は works 応答で確定する。
async function selectStudioById(id: number) {
  searchMode.value = 'studio'
  selectedStaff.value = null
  mediaAuthorChoices.value = []
  selectedStudio.value = { id, name: '', favourites: null, isAnimationStudio: false }
  closeDropdown()
  const mySeq = ++selectSeq
  await loadStudioWorks(id, mySeq)
  if (selectedStudio.value?.id === id) setQuerySilently(selectedStudio.value.name)
}

// 検索モードを切り替える。候補・選択・URL を全部リセットする。
function setSearchMode(mode: SearchMode) {
  if (searchMode.value === mode) return
  searchMode.value = mode
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  // 進行中の検索/選択レスポンスを無効化（stale が新モードに紛れ込むのを防ぐ＝Codex#2/#4）。
  requestSeq++
  selectSeq++
  staffCandidates.value = []
  mediaCandidates.value = []
  studioCandidates.value = []
  searchError.value = ''
  resolveNotice.value = ''
  studioHint.value = ''
  searchLoading.value = false
  // 選択（作者/制作会社）と作品表示も全部リセット（古い結果が残らないように＝Codex#4）。
  clearSelection()
  // URL から ?view/?id（旧 ?staff/?studio も）を外す（再読込/戻るで古い選択が復活しないように＝Codex#3）。
  if (route.query.view != null || route.query.id != null || route.query.staff != null || route.query.studio != null) {
    router.replace({ query: {} })
  }
  closeDropdown()
  setQuerySilently('')
}

// 古い選択のレスポンスでバッジ/作品を上書きしないための連番
let selectSeq = 0

// ── 段階ロード基盤（#3/#4 ＋ 全件取得）─────────────────────────────────────────
// AniList のネストした staffMedia / Studio.media は perPage を要求しても 25 に
// クランプされ（実測 2026-06-14）、`total` は嘘を返す（page1-4 で total=500 と言い
// page5 で 122・hasNext=false）。なので total は使わず hasNextPage だけで辿る。
// 多作（山田尚子=ANIME 122件・けいおんは4ページ目）でも全ロールを集めてから
// クライアント側で役割フィルタしないと、25件クランプで目的の作品が落ちる（#4 の根因）。
// ハード打ち切りはせず、1バッチ=数ページずつ取り、続きがあれば「もっと読み込む」で
// 全件取得できるようにする（件数が多くても切り替えで全部辿れる＝ユーザー要望）。
const RATE_LIMITED_MORE_NOTICE =
  'AniList のレート上限です。少し待ってから「さらに読み込む」で続きを取得できます。'
// 1回の取得で辿る最大ページ数（25件/ページ×25≒625件＝実在の作家/スタジオを超える安全弁）。
// 通常はこの手前で hasNextPage=false に達して全件取得が終わる（#3 京アニ124件=5p / #5 庵野145件=6p）。
const EAGER_PAGE_CAP = 25

let worksCtl: WorksController | null = null
let worksRaw: any[] = [] // 生 edges/nodes の累積（再 transform 用）
let worksCursor = 1 // 次に取るページ番号

// 全ページ（最大 EAGER_PAGE_CAP ページ）を取得して累積に足し、ページ毎に表示を更新する。
// reset=true で先頭から（新しい選択）、false で続き（もっと読み込む）。
async function runWorksBatch(reset: boolean) {
  const ctl = worksCtl
  if (!ctl) return
  if (reset) {
    worksRaw = []
    worksCursor = 1
    worksSort.value = DEFAULT_SORT // 新しい選択は初期=高評価順（「次に何を見るか」に効く）
    clearFilters()                 // 新しい選択はフィルタも初期化（前の人の条件を持ち越さない）
    recommendations.value = []     // 「次に見るなら」レーンも一旦クリア（全件取得後に再取得）
    recsAnchorTitle.value = ''
    worksLoading.value = true
    worksError.value = ''
    worksNotice.value = ''
    worksHasMore.value = false
    worksLoadedCount.value = 0
    filteredWorks.value = []
  } else {
    worksLoadingMore.value = true
  }
  try {
    let pages = 0
    while (pages < EAGER_PAGE_CAP) {
      let data: any
      try {
        data = await anilist(ctl.query, { ...ctl.vars, p: worksCursor })
      } catch (e) {
        // 途中の失敗: 既に取れたぶんは保持し、続きは「さらに読み込む」で。
        if (worksRaw.length > 0) {
          if (isRateLimited(e)) worksNotice.value = RATE_LIMITED_MORE_NOTICE
          worksHasMore.value = true
          break
        }
        throw e // 先頭から失敗 → 呼び出し側のエラー表示へ
      }
      if (ctl.seq !== selectSeq) return // stale（別の選択が来た）
      const page = ctl.pick(data)
      if (!page) {
        worksHasMore.value = false
        // 先頭ページで対象（Staff/Studio）が null＝不正/古い id（共有リンク切れ等・クラスD）。
        if (worksRaw.length === 0 && !worksError.value) {
          worksError.value = '作品が見つかりませんでした。リンクが古いか、削除された可能性があります。'
        }
        break
      }
      worksRaw.push(...page.items)
      worksCursor++
      pages++
      worksLoadedCount.value = worksRaw.length // 進捗表示用（「読み込み中… N件」）
      if (ctl.seq !== selectSeq) return
      if (!page.hasNextPage) { worksHasMore.value = false; break }
      // まだ続きがある。cap で抜けた場合だけ「さらに読み込む」を残す。
      worksHasMore.value = true
    }
    if (ctl.seq !== selectSeq) return
    // 全ページを取り終えてから一度だけグリッドへ反映する。ページ毎に逐次反映すると、後発
    // ページの高評価作がクライアント側ソートに割り込んで既表示カードを並び替え、「見ている
    // 途中に配置が換わる」不快感を生む（多作な作者・制作会社で顕著＝ユーザー報告 2026-06-15）。
    // 取得中はスケルトンで領域を予約し、確定した並びをここで一発描画する＝リフロー無し。
    filteredWorks.value = ctl.transform(worksRaw)
    worksLoading.value = false
    worksLoadingMore.value = false
    // 全ページ取得後に1回だけ後処理（例: studio バッジの一括解決）。
    if (ctl.seq !== selectSeq) return // onBatch 直前に再確認（モード切替の隙間・resilience）
    if (ctl.onBatch) await ctl.onBatch(filteredWorks.value)
    // onBatch の await 中に別の選択へ移っていたら、ここで止める。stale な recs/通知が
    // 現在の選択のレーンを消すのを防ぐ（Codex#1）。
    if (ctl.seq !== selectSeq) return
    // cap（EAGER_PAGE_CAP）truncation の案内は onBatch（studio バッジ取得＝worksNotice を
    // '' にしうる）の後に置く＝capされた一覧で案内が消えないように（Codex#4）。429 通知は上書きしない。
    if (worksHasMore.value && !worksNotice.value) {
      worksNotice.value = '件数が多いため一部のみ表示しています。「さらに読み込む」で続きを取得できます。'
    }
    // 「次に見るなら」: 全件取得後、代表作のおすすめを読み込む（付加価値・失敗は無視）。
    void loadRecommendations(pickRecAnchor(), ctl.seq)
  } catch (e) {
    // 自分（この呼び出し）が現役の時だけエラーを表示する。global worksCtl.seq でなく
    // local ctl.seq を見る＝stale な失敗が新しい選択の画面にエラーを書かない（レビュー#3）。
    if (ctl.seq !== selectSeq) return
    worksError.value = isRateLimited(e)
      ? RATE_LIMIT_MSG
      : '作品の取得中にエラーが発生しました。少し待ってから再試行してください。'
    worksLoading.value = false
    worksLoadingMore.value = false
  } finally {
    // stale-return（別の選択が来た）で抜けた時も、この呼び出しが現役ならローディングを
    // 必ず畳む（戻る/高速切替での無限スピナー防止・クラスC）。stale なら触らない
    // ＝新しい選択が自前のスピナーを管理しているため。
    if (ctl.seq === selectSeq) {
      worksLoading.value = false
      worksLoadingMore.value = false
    }
  }
}

// 「もっと読み込む」: 続きのバッチを取得して追記する。
async function loadMoreWorks() {
  if (worksLoadingMore.value || worksLoading.value) return
  await runWorksBatch(false)
}

// 選択を解除して初期状態へ戻す（URL から ?staff が外れた＝戻る操作 等）
function clearSelection() {
  selectedStaff.value = null
  selectedStudio.value = null
  filteredWorks.value = []
  studioBadges.value = {}
  expandedStudios.value = new Set()
  worksError.value = ''
  worksNotice.value = ''
  mediaAuthorChoices.value = []
  recommendations.value = []
  recsAnchorTitle.value = ''
  collaborators.value = []
  collabStudios.value = []
  clearFilters()
  // 段階ロード状態もリセット
  worksCtl = null
  worksRaw = []
  worksHasMore.value = false
  worksLoading.value = false       // 戻る操作で読み込み中に解除されても無限スピナーにしない（クラスC）
  worksLoadingMore.value = false
  worksLoadedCount.value = 0
}

// 作品＋スタジオバッジを読み込む（selectedStaff は呼び出し側で先にセット済み）。
// 全ページ辿ってから staffRole フィルタ＝25件クランプで Story&Art 作品が落ちない（#3）。
// 段階ロード（バッチ）で、件数が多くても「もっと読み込む」で全件取れる。
async function loadWorks(id: number, mySeq: number) {
  studioBadges.value = {}
  expandedStudios.value = new Set()
  selectedStaffKind.value = 'author'
  selectedStaffRoleKey.value = null
  pushView('creator', id) // URL: ?view=creator&id=… （共有・リロード・戻る対応）
  worksCtl = {
    query: WORKS_QUERY,
    vars: { id },
    pick: (data) => {
      const sm = data?.data?.Staff?.staffMedia
      if (!sm) return null
      // works クエリも name を返す。?staff=ID 直アクセス（名前未確定）の時に確定させる。
      if (selectedStaff.value?.id === id && data.data.Staff?.name) {
        selectedStaff.value = { ...selectedStaff.value, name: data.data.Staff.name }
      }
      return { items: (sm.edges ?? []) as WorkEdge[], hasNextPage: !!sm.pageInfo?.hasNextPage }
    },
    // staffRole フィルタ後、同一作品が複数ロールで重複するので node id で1件に畳む。
    transform: (raw: WorkEdge[]) => {
      const matched = raw.filter(edge => STAFF_ROLE_FILTER.some(role => edge.staffRole.includes(role)))
      const seen = new Set<number>()
      return matched.filter(edge => {
        if (seen.has(edge.node.id)) return false
        seen.add(edge.node.id)
        return true
      })
    },
    // 表示後にアニメ化（制作会社）バッジを後追いで差し込む（best-effort）。
    onBatch: async (works) => { await loadStudioBadges(works, mySeq); if (mySeq === selectSeq) await loadCollaborators(works, id, null, mySeq) },
    seq: mySeq,
  }
  await runWorksBatch(true)
}

// 監督モード: 選んだ人物が監督した作品（アニメ）を新しい順で表示。スタジオバッジは付けない。
// 監督ロールは全アニメ credits（episode/storyboard 含む数百件）中ごく少数に散在し、
// 25件クランプだと古い代表作が落ちる（山田尚子のけいおん=2009 は4ページ目＝#4 の根因）。
// 全ページ辿ってから isDirectorRole で抽出する。
async function loadDirectorWorks(id: number, mySeq: number) {
  studioBadges.value = {}
  expandedStudios.value = new Set()
  selectedStaffKind.value = 'director'
  selectedStaffRoleKey.value = null
  pushView('director', id) // URL: ?view=director&id=… （共有・リロード・戻る対応）
  worksCtl = {
    query: DIRECTOR_WORKS_QUERY,
    vars: { id },
    pick: (data) => {
      const sm = data?.data?.Staff?.staffMedia
      if (!sm) return null
      if (selectedStaff.value?.id === id && data.data.Staff?.name) {
        selectedStaff.value = { ...selectedStaff.value, name: data.data.Staff.name }
      }
      return { items: (sm.edges ?? []) as WorkEdge[], hasNextPage: !!sm.pageInfo?.hasNextPage }
    },
    // 監督ロールのみ＋ node id で重複排除（並び順は displayWorks が担当）。
    transform: (raw: WorkEdge[]) => {
      const seen = new Set<number>()
      return raw
        .filter(e => isDirectorRole(e.staffRole))
        .filter(e => { if (seen.has(e.node.id)) return false; seen.add(e.node.id); return true })
        .map(e => ({ staffRole: '監督', node: { ...e.node, relations: { edges: [] } } }))
    },
    onBatch: async (works) => { await loadCollaborators(works, id, null, mySeq) },
    seq: mySeq,
  }
  await runWorksBatch(true)
}

// staffrole モード（#2/#3）: シリーズ構成/脚本/キャラ原案 で選ばれた人物の、その役割の
// アニメ作品を表示する。監督作と同じ ANIME credits を全ページ引き、役割ファミリで絞る＝
// クリック元のアニメ（けいおん・リズと青い鳥 等）もちゃんと出る。スタジオバッジは付けない。
async function loadStaffRoleWorks(id: number, mySeq: number, roleKey: RoleKey) {
  studioBadges.value = {}
  expandedStudios.value = new Set()
  selectedStaffKind.value = 'staffrole'
  selectedStaffRoleKey.value = roleKey
  selectedRoleLabel.value = STAFF_ROLE_FAMILIES[roleKey].label
  pushView(roleKey, id) // URL: ?view=writing|chardesign|creative&id=… （共有・リロード・戻る対応）
  const re = STAFF_ROLE_FAMILIES[roleKey].match
  const label = STAFF_ROLE_FAMILIES[roleKey].label
  worksCtl = {
    query: DIRECTOR_WORKS_QUERY,
    vars: { id },
    pick: (data) => {
      const sm = data?.data?.Staff?.staffMedia
      if (!sm) return null
      if (selectedStaff.value?.id === id && data.data.Staff?.name) {
        selectedStaff.value = { ...selectedStaff.value, name: data.data.Staff.name }
      }
      return { items: (sm.edges ?? []) as WorkEdge[], hasNextPage: !!sm.pageInfo?.hasNextPage }
    },
    transform: (raw: WorkEdge[]) => {
      const seen = new Set<number>()
      return raw
        .filter(e => re.test(e.staffRole))
        .filter(e => { if (seen.has(e.node.id)) return false; seen.add(e.node.id); return true })
        .map(e => ({ staffRole: themeRoleLabel(e.staffRole, label), node: { ...e.node, relations: { edges: [] } } }))
    },
    onBatch: async (works) => { await loadCollaborators(works, id, null, mySeq) },
    seq: mySeq,
  }
  await runWorksBatch(true)
}

// 声優の出演作を全ページ取得。同じ作品で複数キャラを演じる場合は作品単位に畳んでキャラを統合し、
// 関わり方（主演/助演/端役）は最も主役寄りのロールを採る。並びは displayWorks（既定=高評価順）。
async function loadVoiceWorks(id: number, mySeq: number) {
  studioBadges.value = {}
  expandedStudios.value = new Set()
  selectedStaffKind.value = 'voice'
  selectedStaffRoleKey.value = null
  pushView('voice', id) // URL: ?view=voice&id=… （共有・リロード・戻る対応）
  worksCtl = {
    query: VOICE_WORKS_QUERY,
    vars: { id },
    pick: (data) => {
      const cm = data?.data?.Staff?.characterMedia
      if (!cm) return null
      if (selectedStaff.value?.id === id && data.data.Staff?.name) {
        selectedStaff.value = { ...selectedStaff.value, name: data.data.Staff.name }
      }
      return { items: (cm.edges ?? []) as VoiceEdge[], hasNextPage: !!cm.pageInfo?.hasNextPage }
    },
    transform: (raw: VoiceEdge[]) => {
      const roleRank: Record<string, number> = { MAIN: 0, SUPPORTING: 1, BACKGROUND: 2 }
      const roleJp: Record<string, string> = { MAIN: '主演', SUPPORTING: '助演', BACKGROUND: '端役' }
      const groups = new Map<number, { edge: WorkEdge; bestRank: number }>()
      for (const e of raw) {
        const chars = (e.characters ?? []).map(c => ({
          id: c.id, name: c.name?.native || c.name?.full || null, image: c.image?.medium ?? null,
        }))
        const rank = roleRank[e.characterRole] ?? 9
        const g = groups.get(e.node.id)
        if (g) {
          for (const c of chars) if (!g.edge.characters!.some(m => m.id === c.id)) g.edge.characters!.push(c)
          if (rank < g.bestRank) {
            g.bestRank = rank
            g.edge.staffRole = roleJp[e.characterRole] ?? e.characterRole
          }
        } else {
          groups.set(e.node.id, {
            bestRank: rank,
            edge: {
              staffRole: roleJp[e.characterRole] ?? e.characterRole,
              characters: chars,
              node: {
                id: e.node.id, title: e.node.title, startDate: e.node.startDate,
                coverImage: e.node.coverImage, siteUrl: e.node.siteUrl,
                averageScore: e.node.averageScore, popularity: e.node.popularity,
                genres: e.node.genres ?? [], episodes: e.node.episodes,
                format: e.node.format, status: e.node.status, relations: { edges: [] },
              },
            },
          })
        }
      }
      return [...groups.values()].map(g => g.edge)
    },
    onBatch: async (works) => { await loadCollaborators(works, id, null, mySeq) },
    seq: mySeq,
  }
  await runWorksBatch(true)
}

// 「最近見た声優」クリック等から、出演作を id で読み込む（名前は確定済み）。
async function selectVoiceById(id: number, name: string) {
  selectedStudio.value = null
  mediaAuthorChoices.value = []
  closeDropdown()
  const mySeq = ++selectSeq
  selectedStaff.value = { id, name: { full: name, native: name }, primaryOccupations: [], favourites: null, image: null }
  await loadVoiceWorks(id, mySeq)
}

// 候補クリックから選択。作者/監督/声優モードで読み込む作品を切替える。
async function selectStaff(staff: StaffCandidate) {
  cancelPendingSearch()
  const name = staff.name.native || staff.name.full
  setQuerySilently(name)
  closeDropdown()
  mediaAuthorChoices.value = []
  selectedStudio.value = null
  resolveNotice.value = ''
  clearMusicBrainz()
  const mySeq = ++selectSeq
  selectedStaff.value = staff
  // 監督モード: その人物の「監督作品（アニメ）」を表示。最近見た監督へ保存（URL は v1 で載せない）。
  if (searchMode.value === 'director') {
    saveRecent('director', staff.id, name)
    $posthog?.capture('creator_viewed', { staff_id: staff.id, staff_name: name, source: 'director_search' })
    await loadDirectorWorks(staff.id, mySeq)
    return
  }
  // 声優モード: その人物の出演作（アニメ）を表示。URL は load 関数の pushView が載せる。
  if (searchMode.value === 'voice') {
    saveRecent('voice', staff.id, name)
    $posthog?.capture('creator_viewed', { staff_id: staff.id, staff_name: name, source: 'voice_search' })
    await loadVoiceWorks(staff.id, mySeq)
    return
  }
  // 脚本モード: その人物のアニメ参加作（脚本・シリーズ構成）を表示。
  if (searchMode.value === 'writing') {
    saveRecent('writing', staff.id, name)
    $posthog?.capture('creator_viewed', { staff_id: staff.id, staff_name: name, source: 'writing_search' })
    await loadStaffRoleWorks(staff.id, mySeq, 'writing')
    return
  }
  // キャラ原案モード: その人物のアニメ参加作（キャラクター原案）を表示。
  if (searchMode.value === 'chardesign') {
    saveRecent('chardesign', staff.id, name)
    $posthog?.capture('creator_viewed', { staff_id: staff.id, staff_name: name, source: 'chardesign_search' })
    await loadStaffRoleWorks(staff.id, mySeq, 'chardesign')
    return
  }
  // 音楽/OP・ED モード: staffRole の正規表現で絞り込む。MusicBrainz も並行検索。
  if (searchMode.value === 'music' || searchMode.value === 'theme-singer' || searchMode.value === 'theme-lyrics' || searchMode.value === 'theme-compose') {
    saveRecent(searchMode.value, staff.id, name)
    $posthog?.capture('creator_viewed', { staff_id: staff.id, staff_name: name, source: `${searchMode.value}_search` })
    loadMusicBrainz(staff.name)
    await loadStaffRoleWorks(staff.id, mySeq, searchMode.value as RoleKey)
    return
  }
  // 作者モード。URL（?view=creator&id=…）は loadWorks 内の pushView が載せる。
  saveRecent('creator', staff.id, name)
  $posthog?.capture('creator_viewed', { staff_id: staff.id, staff_name: name, source: 'creator_search' })
  await loadWorks(staff.id, mySeq)
}

// 作品候補をクリック→その作品の作り手を解決する。原作/作画など複数いれば
// チューザを出して選ばせ（#2/#3）、1人なら従来どおり自動でその作者へ進む。
async function selectMediaToAuthor(media: MediaCandidate) {
  // 最近見た作品へ保存（#1: 作品モードは作品を覚える。type は再解決で原作ロールの拾い方に使う）。
  saveRecent('title', media.id, displayTitle(media.title), media.type)
  await resolveMediaToAuthor(media.id, media.type, displayTitle(media.title))
}

// 作品 id → 作者解決の本体（作品候補クリックと「最近見た作品」クリックの共通処理）。
async function resolveMediaToAuthor(id: number, type: string, displayName: string) {
  cancelPendingSearch()
  closeDropdown()
  searchError.value = ''
  resolveNotice.value = ''
  // タイトルモードの検索欄には作者名を入れず、選んだ作品名を残す（#3）。
  setQuerySilently(displayName)
  // stale ガード: 解決中に別の選択/検索が来たら、遅れて返る応答は捨てる（Codex#1）。
  const mySeq = ++selectSeq
  try {
    const data = await anilist<{ data: { Media: { staff: { edges: MediaStaffEdge[] } } } }>(MEDIA_STAFF_QUERY, { id })
    if (mySeq !== selectSeq) return
    const edges = data.data.Media?.staff?.edges ?? []
    // アニメは原作＋監督＋構成/脚本/キャラ原案を出す（監督等も辿れるように＝要望）。
    // 漫画は原作＋作画の全系統（すべて kind='author'）。
    const authors = type === 'ANIME' ? collectAnimeCreators(edges) : collectAuthors(edges, AUTHOR_ROLE_MATCHES)
    // 作り手が居なければ案内（resolveNotice は選択が無くても見える独立表示＝Codex#5）。
    if (authors.length === 0) {
      resolveNotice.value = type === 'ANIME'
        ? `「${displayName}」の主要な作り手（原作・監督など）が見つかりませんでした。`
        : `「${displayName}」の作者情報が取得できませんでした。`
      selectedStaff.value = null
      mediaAuthorChoices.value = []
      return
    }
    if (authors.length === 1) {
      await goToChoice(authors[0])
      return
    }
    // 複数（原作＋監督＋… 等）はチューザを表示し、選択を待つ（works はまだ走らせない）。
    mediaAuthorChoices.value = authors
    mediaAuthorSourceTitle.value = displayName
    selectedStaff.value = null
    filteredWorks.value = []
  } catch (e) {
    if (mySeq !== selectSeq) return
    mediaAuthorChoices.value = []
    resolveNotice.value = isRateLimited(e)
      ? RATE_LIMIT_MSG
      : '作者の解決中にエラーが発生しました。少し待ってから再試行してください。'
    selectedStaff.value = null
  }
}

// チューザの選択を種別で振り分ける。原作系→漫画作品（goToAuthor）、監督→監督作品。
async function goToChoice(c: AuthorChoice) {
  if (c.kind === 'director') {
    const display = c.name.native || c.name.full
    saveRecent('director', c.id, display) // 最近見た監督へ
    $posthog?.capture('creator_viewed', { staff_id: c.id, staff_name: display, source: 'title_to_director' })
    await selectDirectorById(c.id, display)
    return
  }
  if (c.kind === 'staffrole' && c.roleKey) {
    const display = c.name.native || c.name.full
    $posthog?.capture('creator_viewed', { staff_id: c.id, staff_name: display, source: 'title_to_staffrole' })
    await selectStaffRoleById(c.id, display, c.roleKey)
    return
  }
  await goToAuthor(c.id, c.name)
}

// 作者を確定して作品を読み込む共通処理（単一作者の自動選択 / チューザ選択 から呼ぶ）。
// ?staff=ID を push するのでディープリンク・戻る・スタジオバッジがそのまま効く。
async function goToAuthor(id: number, name: { full: string; native: string | null }) {
  cancelPendingSearch()
  mediaAuthorChoices.value = []
  selectedStudio.value = null
  const mySeq = ++selectSeq
  selectedStaff.value = { id, name, primaryOccupations: [], favourites: null, image: null }
  const display = name.native || name.full
  // URL（?view=creator&id=…）は loadWorks 内の pushView が載せる。
  // 作品モード由来なので「最近見た作品」は selectMediaToAuthor 側で保存済み（ここでは作者を recent に積まない＝リストをタブと1対1に保つ）。
  $posthog?.capture('creator_viewed', { staff_id: id, staff_name: display, source: 'title_search' })
  await loadWorks(id, mySeq)
}

// 「最近見た監督」クリック等から、監督作品を id で読み込む（名前は確定済み）。
async function selectDirectorById(id: number, name: string) {
  selectedStudio.value = null
  mediaAuthorChoices.value = []
  closeDropdown()
  const mySeq = ++selectSeq
  selectedStaff.value = { id, name: { full: name, native: name }, primaryOccupations: [], favourites: null, image: null }
  await loadDirectorWorks(id, mySeq)
}

// チューザ / 復元 / 脚本・原案タブから、staffrole 作品を id で読み込む（#2/#3）。
async function selectStaffRoleById(id: number, name: string, roleKey: RoleKey) {
  selectedStudio.value = null
  mediaAuthorChoices.value = []
  clearMusicBrainz()
  closeDropdown()
  const mySeq = ++selectSeq
  selectedStaff.value = { id, name: { full: name, native: name }, primaryOccupations: [], favourites: null, image: null }
  if (MUSIC_MODES.has(searchMode.value)) loadMusicBrainz({ full: name, native: name })
  await loadStaffRoleWorks(id, mySeq, roleKey)
}

// 「最近見た」チップ/行のクリック。現在モードに応じて読み込み先を切替える（#1）。
async function selectRecent(r: RecentItem) {
  cancelPendingSearch()
  setQuerySilently(r.name)
  closeDropdown()
  const mode = searchMode.value
  // クリックで最前面へ並べ替え（各モードの list へ）
  // URL（?view=…&id=…）は各 load 関数内の pushView が載せる（候補クリックと対称）。
  if (mode === 'studio') {
    saveRecent('studio', r.id, r.name)
    await selectStudioById(r.id)
    return
  }
  if (mode === 'director') {
    saveRecent('director', r.id, r.name)
    $posthog?.capture('creator_viewed', { staff_id: r.id, staff_name: r.name, source: 'recent' })
    await selectDirectorById(r.id, r.name)
    return
  }
  if (mode === 'voice') {
    saveRecent('voice', r.id, r.name)
    $posthog?.capture('creator_viewed', { staff_id: r.id, staff_name: r.name, source: 'recent' })
    await selectVoiceById(r.id, r.name)
    return
  }
  if (mode === 'writing') {
    saveRecent('writing', r.id, r.name)
    $posthog?.capture('creator_viewed', { staff_id: r.id, staff_name: r.name, source: 'recent' })
    await selectStaffRoleById(r.id, r.name, 'writing')
    return
  }
  if (mode === 'chardesign') {
    saveRecent('chardesign', r.id, r.name)
    $posthog?.capture('creator_viewed', { staff_id: r.id, staff_name: r.name, source: 'recent' })
    await selectStaffRoleById(r.id, r.name, 'chardesign')
    return
  }
  if (mode === 'music' || mode === 'theme-singer' || mode === 'theme-lyrics' || mode === 'theme-compose') {
    saveRecent(mode, r.id, r.name)
    $posthog?.capture('creator_viewed', { staff_id: r.id, staff_name: r.name, source: 'recent' })
    await selectStaffRoleById(r.id, r.name, mode as RoleKey)
    return
  }
  if (mode === 'title') {
    saveRecent('title', r.id, r.name, r.type)
    await resolveMediaToAuthor(r.id, r.type ?? 'MANGA', r.name)
    return
  }
  // creator
  saveRecent('creator', r.id, r.name)
  $posthog?.capture('creator_viewed', { staff_id: r.id, staff_name: r.name, source: 'recent' })
  await selectStaffById(r.id)
}

// URL（?staff=ID）や戻る/進む操作から選択。名前は works クエリ応答で確定する。
async function selectStaffById(id: number) {
  const mySeq = ++selectSeq
  selectedStaff.value = { id, name: { full: '', native: null }, primaryOccupations: [], favourites: null, image: null }
  selectedStudio.value = null
  closeDropdown()
  mediaAuthorChoices.value = []
  await loadWorks(id, mySeq)
  if (selectedStaff.value?.id === id) {
    setQuerySilently(selectedStaff.value.name.native || selectedStaff.value.name.full)
  }
}

const copyToast = ref(false)
async function copyUrl() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copyToast.value = true
    setTimeout(() => { copyToast.value = false }, 2000)
  } catch {}
}
function scrollToRecs() {
  document.querySelector('.recs')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function scrollToCollabs() {
  document.querySelector('.collabs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function shareApp() {
  const url = config.public.siteUrl as string || window.location.origin
  const title = 'Creator Discovery — アニメをクリエイターから探す'
  if (navigator.share) {
    try { await navigator.share({ title, url }) } catch {}
    return
  }
  try {
    await navigator.clipboard.writeText(url)
    alert('URLをコピーしました')
  } catch {}
}

function shareOnX() {
  const name = selectedStaff.value
    ? (selectedStaff.value.name.native || selectedStaff.value.name.full)
    : selectedStudio.value?.name
  if (!name) return
  const count = displayWorks.value.length
  const text = selectedStudio.value
    ? `${name}の制作アニメ、あなたのベストは？ 全${count}作スコア付き一覧 →`
    : selectedStaffKind.value === 'director'
    ? `${name}の最高傑作はどれ？ 全${count}作スコア付き一覧 →`
    : selectedStaffKind.value === 'voice'
    ? `${name}の出演作で一番好きなのは？ ${count}作を一覧で →`
    : MUSIC_MODES.has(searchMode.value)
    ? `${name}の劇伴・主題歌で一番好きなのは？ →`
    : selectedStaffKind.value === 'staffrole'
    ? `${name}の${selectedRoleLabel.value}担当作で推しはどれ？ →`
    : `${name}の作品で一番好きなのは？ →`
  const hashtags = '#アニメ #CreatorDiscovery'
  const url = window.location.href
  const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + '\n' + hashtags)}&url=${encodeURIComponent(url)}`
  window.open(intent, '_blank', 'noopener')
}

// ── Studio badges ───────────────────────────────────────────────────────────
// AniList は relations 配下の studios をネスト取得すると 500 を返す（relation
// ノード1つにつき1エラー＝既知の制約）。そこで2フェーズ目として、表示作品の
// ADAPTATION→ANIME の media id を集め、その制作会社を id_in で一括取得する。
// 429 自動リトライの待ち時間（ms・Retry-After が無い時の fallback）。要素数＝最大リトライ回数。
const STUDIO_RETRY_FALLBACK = [20000, 40000]

// anime media id → 主要制作会社名（アニメ制作会社を優先）。id は 50 件ずつ分割。
async function fetchStudiosByAnime(ids: number[]): Promise<Map<number, string[]>> {
  const out = new Map<number, string[]>()
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50)
    try {
      const data = await anilist<{
        data: { Page: { media: { id: number; studios: { nodes: StudioNode[] } | null }[] } }
      }>(STUDIO_QUERY, { ids: chunk })
      for (const m of data?.data?.Page?.media ?? []) {
        const nodes = m.studios?.nodes ?? []
        const anim = nodes.filter(n => n.isAnimationStudio).map(n => n.name)
        // isMain は通常アニメ制作会社。フラグが付かない時だけ全 main にフォールバック
        out.set(m.id, anim.length ? anim : nodes.map(n => n.name))
      }
    } catch (e) {
      // 429 は上位（loadStudioBadges）のリトライ／全体クールダウンに任せて伝播。
      if (isRateLimited(e)) throw e
      // それ以外の1チャンク失敗は握って次へ＝部分的にでもバッジを出す（クラスD・全消し防止）。
    }
  }
  return out
}

// 表示中の各作品に「アニメ化した制作会社」バッジを解決する。
async function loadStudioBadges(works: WorkEdge[], mySeq: number) {
  const animeIdsByManga = new Map<number, number[]>()
  const allAnimeIds = new Set<number>()
  for (const edge of works) {
    const ids = (edge.node.relations?.edges ?? [])
      .filter(r => r.relationType === 'ADAPTATION' && r.node.type === 'ANIME')
      .map(r => r.node.id)
    if (ids.length) {
      animeIdsByManga.set(edge.node.id, ids)
      ids.forEach(id => allAnimeIds.add(id))
    }
  }
  if (allAnimeIds.size === 0) return

  // 429（レート上限）を踏んだら少し待って自動リトライ（最大2回・Retry-After 尊重）。
  // グリッドは既に表示済みなので、バッジだけ後追いで埋める best-effort。
  for (let attempt = 0; ; attempt++) {
    try {
      const studioByAnime = await fetchStudiosByAnime([...allAnimeIds])
      if (mySeq !== selectSeq) return
      const badges: Record<number, string[]> = {}
      for (const [mangaId, animeIds] of animeIdsByManga) {
        const counts = new Map<string, number>()
        for (const aid of animeIds) {
          for (const name of studioByAnime.get(aid) ?? []) {
            counts.set(name, (counts.get(name) ?? 0) + 1)
          }
        }
        // 劇場版などで複数社あるとき、最頻＝その作品の主たる制作会社を先頭に
        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n)
        if (sorted.length) badges[mangaId] = sorted
      }
      studioBadges.value = badges
      worksNotice.value = '' // 取得できたら待機通知を消す
      return
    } catch (e) {
      if (mySeq !== selectSeq) return
      // 429 なら待ってリトライ（待っている間に別の作者を選んだら中止）
      if (isRateLimited(e) && attempt < STUDIO_RETRY_FALLBACK.length) {
        worksNotice.value =
          'アニメ化（制作会社）情報は AniList のレート上限中です。自動で再取得します…'
        await sleep(retryDelayMs(e, STUDIO_RETRY_FALLBACK[attempt]))
        if (mySeq !== selectSeq) return
        continue
      }
      // リトライ尽き or 429 以外 → バッジ無しで継続（グリッドは保持）
      if (isRateLimited(e)) {
        worksNotice.value =
          'アニメ化（制作会社）情報は AniList のレート上限のため省略しました。少し待って選び直すと表示されます。'
      }
      return
    }
  }
}

const recommendations = ref<RecItem[]>([])
const recsAnchorTitle = ref('') // 「『◯◯』が好きなら」の◯◯
const recsLoading = ref(false)
let recsSeq = 0

// 推薦の起点（アンカー）= ロード済み全作品から評価×知名度が最大の1作（フィルタ非依存）。
function pickRecAnchor(): WorkEdge | null {
  let best: WorkEdge | null = null
  let bestKey = -Infinity
  let maxPop = 1
  for (const e of filteredWorks.value) maxPop = Math.max(maxPop, e.node.popularity ?? 0)
  for (const e of filteredWorks.value) {
    if (e.node.averageScore == null) continue
    const key = e.node.averageScore + 8 * ((e.node.popularity ?? 0) / maxPop)
    if (key > bestKey) { bestKey = key; best = e }
  }
  return best
}

async function loadRecommendations(anchor: WorkEdge | null, mySeq: number) {
  // stale な呼び出し（onBatch await 中に選択が変わった）が現在の選択の recs を消さないよう、
  // クリアより前に staleness を確認する（Codex#1）。
  if (mySeq !== selectSeq) return
  recommendations.value = []
  recsAnchorTitle.value = ''
  if (!anchor) return
  const my = ++recsSeq
  recsLoading.value = true
  try {
    const data = await anilist<{
      data: { Media: { recommendations: { nodes: { rating: number; mediaRecommendation: {
        id: number; type: string
        title: { native: string | null; romaji: string | null; english: string | null }
        coverImage: { medium: string | null } | null; siteUrl: string
        averageScore: number | null; startDate: { year: number | null } | null
      } | null }[] } } }
    }>(RECOMMENDATIONS_QUERY, { id: anchor.node.id })
    if (my !== recsSeq || mySeq !== selectSeq) return
    const ownIds = new Set(filteredWorks.value.map(e => e.node.id)) // 本人の作品は推薦から除く
    const seen = new Set<number>()
    const out: RecItem[] = []
    for (const n of data?.data?.Media?.recommendations?.nodes ?? []) {
      const m = n.mediaRecommendation
      if (!m || seen.has(m.id) || ownIds.has(m.id)) continue
      seen.add(m.id)
      out.push({
        id: m.id, type: m.type, title: m.title, coverImage: m.coverImage,
        siteUrl: m.siteUrl, averageScore: m.averageScore, year: m.startDate?.year ?? null,
      })
      if (out.length >= 12) break
    }
    recommendations.value = out
    recsAnchorTitle.value = displayTitle(anchor.node.title)
  } catch {
    // 推薦は付加価値。失敗は黙って省略。
  } finally {
    if (my === recsSeq) recsLoading.value = false
  }
}

async function chainRecommendation(rec: RecItem) {
  const my = ++recsSeq
  recsLoading.value = true
  recommendations.value = []
  recsAnchorTitle.value = ''
  try {
    const data = await anilist<{
      data: { Media: { recommendations: { nodes: { rating: number; mediaRecommendation: {
        id: number; type: string
        title: { native: string | null; romaji: string | null; english: string | null }
        coverImage: { medium: string | null } | null; siteUrl: string
        averageScore: number | null; startDate: { year: number | null } | null
      } | null }[] } } }
    }>(RECOMMENDATIONS_QUERY, { id: rec.id })
    if (my !== recsSeq) return
    const seen = new Set<number>([rec.id])
    const out: RecItem[] = []
    for (const n of data?.data?.Media?.recommendations?.nodes ?? []) {
      const m = n.mediaRecommendation
      if (!m || seen.has(m.id)) continue
      seen.add(m.id)
      out.push({
        id: m.id, type: m.type, title: m.title, coverImage: m.coverImage,
        siteUrl: m.siteUrl, averageScore: m.averageScore, year: m.startDate?.year ?? null,
      })
      if (out.length >= 12) break
    }
    recommendations.value = out
    recsAnchorTitle.value = displayTitle(rec.title)
  } catch {
    // chain failure is non-critical
  } finally {
    if (my === recsSeq) recsLoading.value = false
  }
}

// ── よく組むクリエイター / 制作会社（全モード共通・best-effort）──────────────────
const collaborators = ref<CollabPerson[]>([])
const collabStudios = ref<CollabStudio[]>([])

async function loadCollaborators(
  works: WorkEdge[],
  excludeStaffId: number | null,
  excludeStudioId: number | null,
  mySeq: number
) {
  collaborators.value = []
  collabStudios.value = []
  const animeIds = new Set<number>()
  for (const w of works) {
    const adaptations = (w.node.relations?.edges ?? []).filter(r => r.relationType === 'ADAPTATION' && r.node.type === 'ANIME')
    if (adaptations.length > 0) adaptations.forEach(r => animeIds.add(r.node.id))
    else animeIds.add(w.node.id)
  }
  if (animeIds.size === 0) return
  const topIds = [...animeIds].slice(0, 18)
  const personMap = new Map<number, { name: { full: string; native: string | null }; occ: string[]; image: string | null; roles: string[]; count: number }>()
  const studioMap = new Map<number, { name: string; count: number }>()
  for (let i = 0; i < topIds.length; i += 6) {
    const chunk = topIds.slice(i, i + 6)
    try {
      const data = await anilist<{ data: { Page: { media: {
        id: number
        staff: { edges: { role: string; node: { id: number; name: { full: string; native: string | null }; primaryOccupations: string[]; image: { medium: string | null } | null } }[] } | null
        studios: { nodes: { id: number; name: string; isAnimationStudio: boolean }[] } | null
      }[] } } }>(COLLAB_QUERY, { ids: chunk })
      if (mySeq !== selectSeq) return
      for (const media of data?.data?.Page?.media ?? []) {
        for (const edge of media.staff?.edges ?? []) {
          const sid = edge.node.id
          if (sid === excludeStaffId) continue
          const role = (edge.role ?? '').trim()
          const existing = personMap.get(sid)
          if (existing) {
            if (!existing.roles.includes(role)) existing.roles.push(role)
            existing.count++
          } else {
            personMap.set(sid, { name: edge.node.name, occ: edge.node.primaryOccupations ?? [], image: edge.node.image?.medium ?? null, roles: [role], count: 1 })
          }
        }
        for (const studio of media.studios?.nodes ?? []) {
          if (studio.id === excludeStudioId) continue
          const existing = studioMap.get(studio.id)
          if (existing) existing.count++
          else studioMap.set(studio.id, { name: studio.name, count: 1 })
        }
      }
    } catch (e) {
      if (isRateLimited(e)) break
    }
  }
  if (mySeq !== selectSeq) return
  const collabLimit = excludeStudioId != null ? 20 : 10
  collaborators.value = [...personMap.entries()]
    .filter(([_, p]) => p.count >= 2)
    .sort(([_, a], [__, b]) => b.count - a.count)
    .slice(0, collabLimit)
    .map(([id, p]) => ({ id, name: p.name, occupations: p.occ, image: p.image, topRole: pickBestRole(p.roles), count: p.count }))
  collabStudios.value = [...studioMap.entries()]
    .filter(([_, s]) => s.count >= 2)
    .sort(([_, a], [__, b]) => b.count - a.count)
    .slice(0, 6)
    .map(([id, s]) => ({ id, name: s.name, count: s.count }))
}

const ROLE_GROUP_ORDER = ['監督', '脚本', 'キャラ原案', '音楽', 'その他のスタッフ'] as const
type RoleGroupKey = typeof ROLE_GROUP_ORDER[number]
function roleGroupKey(topRole: string): RoleGroupKey {
  if (topRole === '監督') return '監督'
  if (topRole === 'シリーズ構成' || topRole === '脚本') return '脚本'
  if (topRole === 'キャラ原案') return 'キャラ原案'
  if (topRole === '音楽' || topRole === '作曲・編曲' || topRole === '作詞' || topRole === 'OP/ED歌手') return '音楽'
  return 'その他のスタッフ'
}
const studioKeyStaff = computed(() => {
  if (!selectedStudio.value || collaborators.value.length === 0) return []
  const groups = new Map<RoleGroupKey, CollabPerson[]>()
  for (const c of collaborators.value) {
    const key = roleGroupKey(c.topRole)
    const list = groups.get(key)
    if (list) list.push(c)
    else groups.set(key, [c])
  }
  return ROLE_GROUP_ORDER.filter(k => groups.has(k)).map(k => ({ label: k, staff: groups.get(k)! }))
})

function goToCollaborator(c: CollabPerson) {
  const name = c.name.native || c.name.full
  if (c.topRole === '監督') { searchMode.value = 'director'; saveRecent('director', c.id, name); selectDirectorById(c.id, name); return }
  if (c.topRole === 'シリーズ構成' || c.topRole === '脚本') { searchMode.value = 'writing'; saveRecent('writing', c.id, name); selectStaffRoleById(c.id, name, 'writing'); return }
  if (c.topRole === 'キャラ原案') { searchMode.value = 'chardesign'; saveRecent('chardesign', c.id, name); selectStaffRoleById(c.id, name, 'chardesign'); return }
  if (c.topRole === '音楽') { searchMode.value = 'music'; saveRecent('music', c.id, name); selectStaffRoleById(c.id, name, 'music'); return }
  if (c.topRole === 'OP/ED歌手') { searchMode.value = 'theme-singer'; saveRecent('theme-singer', c.id, name); selectStaffRoleById(c.id, name, 'theme-singer'); return }
  if (c.topRole === '作詞') { searchMode.value = 'theme-lyrics'; saveRecent('theme-lyrics', c.id, name); selectStaffRoleById(c.id, name, 'theme-lyrics'); return }
  if (c.topRole === '作曲・編曲') { searchMode.value = 'theme-compose'; saveRecent('theme-compose', c.id, name); selectStaffRoleById(c.id, name, 'theme-compose'); return }
  searchMode.value = 'creator'; saveRecent('creator', c.id, name); selectStaffById(c.id)
}

function goToCollabStudio(s: CollabStudio) {
  searchMode.value = 'studio'
  selectStudio({ id: s.id, name: s.name, favourites: null, isAnimationStudio: true })
}

// ── 人気の制作会社（起動時に取得・スタジオ検索の空入力時にドロップダウンへ出す）───────
const popularStudios = ref<StudioCandidate[]>([])
async function fetchPopularStudios() {
  try {
    const data = await anilist<{ data: { Page: { studios: StudioCandidate[] } } }>(POPULAR_STUDIOS_QUERY)
    popularStudios.value = (data?.data?.Page?.studios ?? []).filter(s => s.isAnimationStudio)
  } catch { /* best effort */ }
}
const showPopularStudios = computed(() =>
  dropdownOpen.value && searchQuery.value.trim().length === 0 &&
  searchMode.value === 'studio' && popularStudios.value.length > 0
)
const popularStudiosFiltered = computed(() => {
  const recentIds = new Set(currentRecent.value.map(r => r.id))
  return popularStudios.value.filter(s => !recentIds.has(s.id)).slice(0, 12)
})
</script>
