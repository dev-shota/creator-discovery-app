export const SEARCH_QUERY = `
  query($s: String) {
    Page(perPage: 20) {
      staff(search: $s) {
        id
        name { full native }
        primaryOccupations
        favourites
        image { medium }
      }
    }
  }
`

export const TITLE_SEARCH_QUERY = `
  query($s: String) {
    Page(perPage: 20) {
      media(search: $s, sort: [SEARCH_MATCH, POPULARITY_DESC]) {
        id type format popularity startDate { year }
        title { native romaji english } coverImage { medium }
      }
    }
  }
`

export const STUDIO_SEARCH_QUERY = `
  query($s: String) {
    Page(perPage: 20) {
      studios(search: $s) { id name favourites isAnimationStudio }
    }
  }
`

export const STUDIO_WORKS_QUERY = `
  query($id: Int, $p: Int) {
    Studio(id: $id) {
      name
      media(isMain: true, sort: [SCORE_DESC], page: $p, perPage: 50) {
        pageInfo { hasNextPage }
        nodes {
          id
          title { native romaji english }
          startDate { year }
          coverImage { medium }
          siteUrl
          averageScore popularity genres episodes format status
        }
      }
    }
  }
`

export const WORKS_QUERY = `
  query($id: Int, $p: Int) {
    Staff(id: $id) {
      name { full native }
      staffMedia(type: MANGA, sort: SCORE_DESC, page: $p, perPage: 50) {
        pageInfo { hasNextPage }
        edges {
          staffRole
          node {
            id
            title { native romaji english }
            startDate { year }
            coverImage { medium }
            siteUrl
            averageScore popularity genres episodes format status
            relations { edges { relationType node { id type title { romaji native } startDate { year } format } } }
          }
        }
      }
    }
  }
`

export const DIRECTOR_WORKS_QUERY = `
  query($id: Int, $p: Int) {
    Staff(id: $id) {
      name { full native }
      staffMedia(type: ANIME, sort: SCORE_DESC, page: $p, perPage: 50) {
        pageInfo { hasNextPage }
        edges {
          staffRole
          node {
            id
            title { native romaji english }
            startDate { year }
            coverImage { medium }
            siteUrl
            averageScore popularity genres episodes format status
          }
        }
      }
    }
  }
`

export const VOICE_WORKS_QUERY = `
  query($id: Int, $p: Int) {
    Staff(id: $id) {
      name { full native }
      characterMedia(sort: START_DATE_DESC, page: $p, perPage: 50) {
        pageInfo { hasNextPage }
        edges {
          characterRole
          node {
            id
            title { native romaji english }
            startDate { year }
            coverImage { medium }
            siteUrl
            averageScore popularity genres episodes format status
          }
          characters { id name { native full } image { medium } }
        }
      }
    }
  }
`

export const MEDIA_STAFF_QUERY = `
  query($id: Int) {
    Media(id: $id) {
      staff(sort: [RELEVANCE]) {
        edges { role node { id name { full native } } }
      }
    }
  }
`

export const STUDIO_QUERY = `
  query($ids: [Int]) {
    Page(perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        id
        studios(isMain: true) { nodes { name isAnimationStudio } }
      }
    }
  }
`

export const COLLAB_QUERY = `
  query($ids: [Int]) {
    Page(perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        id
        staff(sort: [RELEVANCE], perPage: 12) {
          edges { role node { id name { full native } primaryOccupations image { medium } } }
        }
        studios(isMain: true) { nodes { id name isAnimationStudio } }
      }
    }
  }
`

export const POPULAR_STUDIOS_QUERY = `
  query { Page(perPage: 30) { studios(sort: FAVOURITES_DESC) { id name favourites isAnimationStudio } } }
`
