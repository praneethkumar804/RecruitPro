import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from './api'

const tabs = [
  { id: 'feed', label: 'Feed', endpoint: '/network/posts/' },
  { id: 'people', label: 'Discover people', endpoint: '/network/people/' },
  { id: 'connections', label: 'Connections', endpoint: '/network/connections/' },
  { id: 'following', label: 'Following', endpoint: '/network/following/' },
]

function displayName(person) {
  const name = [person.first_name, person.last_name].filter(Boolean).join(' ')
  return name || person.email
}

function pageResults(data) {
  return Array.isArray(data) ? data : data.results || []
}

function NetworkImage({ post }) {
  const [src, setSrc] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    let objectUrl = ''
    setFailed(false)
    api.get(post.image_url, { responseType: 'blob' })
      .then(({ data }) => {
        objectUrl = URL.createObjectURL(data)
        if (active) setSrc(objectUrl)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [post.image_url])

  if (failed) return <p className="network-image-error" role="alert">This photo could not be loaded.</p>
  return src ? <img className="network-post-image" src={src} alt={`Work update shared by ${displayName(post.author)}`} /> : <span className="network-image-loading">Loading photo…</span>
}

export default function Network({ user }) {
  const [tab, setTab] = useState('feed')
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyUsers, setBusyUsers] = useState([])

  useEffect(() => {
    if (!image) {
      setPreview('')
      return undefined
    }
    const objectUrl = URL.createObjectURL(image)
    setPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [image])

  useEffect(() => {
    let active = true
    const selected = tabs.find(item => item.id === tab)
    setLoading(true)
    setError('')
    const params = tab === 'people' && query ? { search: query } : undefined
    api.get(selected.endpoint, { params })
      .then(({ data }) => { if (active) setItems(pageResults(data)) })
      .catch(err => { if (active) setError(err.response?.data?.detail || 'Could not load this part of your network.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [tab, query])

  async function publishPost(event) {
    event.preventDefault()
    if (!content.trim() && !image) {
      setError('Write something or add a photo before sharing.')
      return
    }
    setPosting(true)
    setError('')
    setNotice('')
    try {
      const body = new FormData()
      if (content.trim()) body.append('content', content.trim())
      if (image) body.append('image', image)
      const { data } = await api.post('/network/posts/', body)
      if (tab === 'feed') setItems(current => [data, ...current])
      setContent('')
      setImage(null)
      setNotice('Your post is live.')
      if (tab !== 'feed') setTab('feed')
    } catch (err) {
      const data = err.response?.data
      setError(data?.detail || data?.image?.[0] || data?.content?.[0] || 'Could not publish your post.')
    } finally {
      setPosting(false)
    }
  }

  async function toggleRelation(person, relation) {
    setBusyUsers(current => [...current, person.id])
    setError('')
    const isActive = relation === 'follow' ? person.is_following : person.is_connected
    const endpoint = relation === 'follow'
      ? `/network/follows/${person.id}/`
      : `/network/connections/${person.id}/`
    try {
      await api.request({ method: isActive ? 'delete' : 'post', url: endpoint })
      if (tab === 'people') {
        setItems(current => current.map(item => item.id === person.id
          ? { ...item, [relation === 'follow' ? 'is_following' : 'is_connected']: !isActive }
          : item))
      } else {
        setItems(current => current.filter(item => item.id !== person.id))
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update this connection. Please try again.')
    } finally {
      setBusyUsers(current => current.filter(id => id !== person.id))
    }
  }

  async function deletePost(post) {
    if (!window.confirm('Delete this post? This cannot be undone.')) return
    try {
      await api.delete(`/network/posts/${post.id}/`)
      setItems(current => current.filter(item => item.id !== post.id))
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not delete the post.')
    }
  }

  return <section className="network-page page-width">
    <header className="network-heading">
      <div><span className="section-kicker">YOUR PROFESSIONAL COMMUNITY</span><h1>Build your network.</h1><p>Meet people, share what you’re working on, and find your next opportunity.</p></div>
      <div className="network-user-badge"><span>{(user.first_name || user.email || 'U')[0].toUpperCase()}</span><div><strong>{displayName(user)}</strong><small>{user.role === 'EMPLOYER' ? 'Employer' : 'Candidate'}</small></div></div>
    </header>

    <div className="network-tabs" role="tablist" aria-label="Professional network">
      {tabs.map(item => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'network-tab active' : 'network-tab'} onClick={() => setTab(item.id)}>{item.label}</button>)}
    </div>

    <div className="network-layout">
      <div className="network-main">
        {error && <div className="notice notice-error" role="alert">{error}</div>}
        {notice && <div className="notice notice-success" role="status">{notice}</div>}

        {tab === 'feed' && <form className="network-composer panel" onSubmit={publishPost}>
          <div className="composer-top"><span className="network-avatar">{(user.first_name || user.email || 'U')[0].toUpperCase()}</span><textarea maxLength={2000} value={content} onChange={event => setContent(event.target.value)} placeholder="Share a project, a lesson, or a work update…" aria-label="Post content" /></div>
          {preview && <div className="post-preview"><img src={preview} alt="Selected post attachment preview" /><button type="button" onClick={() => setImage(null)} aria-label="Remove selected photo">Remove photo</button></div>}
          <div className="composer-footer"><label className="photo-picker">＋ Add a photo<input type="file" accept=".jpg,.jpeg,.png,.gif,.webp" onChange={event => {
            const selected = event.target.files?.[0]
            if (selected && selected.size > 5 * 1024 * 1024) {
              setImage(null)
              setError('Images must be 5 MB or smaller.')
            } else if (selected && !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(selected.type)) {
              setImage(null)
              setError('Choose a JPG, PNG, GIF, or WebP image.')
            } else {
              setImage(selected || null)
              setError('')
            }
            event.target.value = ''
          }} /></label><span>{content.length}/2000 · One image, max 5 MB</span><button className="button button-primary" disabled={posting}>{posting ? 'Sharing…' : 'Share post'}</button></div>
        </form>}

        {tab === 'people' && <form className="network-search" onSubmit={event => { event.preventDefault(); setQuery(search.trim()) }}><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search people by name or email" aria-label="Search people" /><button className="button button-secondary">Search people</button></form>}

        {loading ? <div className="network-loading">Loading your network…</div>
          : tab === 'feed' ? items.length ? <div className="network-feed">{items.map(post => <article className="panel network-post" key={post.id}>
            <header className="post-header"><span className="network-avatar">{(post.author.first_name || post.author.email || 'U')[0].toUpperCase()}</span><div><strong>{displayName(post.author)}</strong><span>{post.author.role === 'EMPLOYER' ? 'Employer' : 'Candidate'} · {new Date(post.created_at).toLocaleString()}</span></div>{post.author.id === user.id && <button className="post-delete" onClick={() => deletePost(post)}>Delete</button>}</header>
            {post.content && <p className="post-content">{post.content}</p>}
            {post.image_url && <NetworkImage post={post} />}
          </article>)}</div> : <div className="panel network-empty"><h2>Your network feed starts here.</h2><p>Share a work update, or discover people to connect with.</p></div>
          : items.length ? <div className="network-people">{items.map(person => <article className="panel person-card" key={person.id}>
            <span className="network-avatar person-avatar">{(person.first_name || person.email || 'U')[0].toUpperCase()}</span>
            <div className="person-info"><strong>{displayName(person)}</strong><span>{person.role === 'EMPLOYER' ? 'Employer' : 'Candidate'} · {person.email}</span><div className="person-actions"><button className="button button-secondary" disabled={busyUsers.includes(person.id)} onClick={() => toggleRelation(person, 'follow')}>{person.is_following ? 'Following' : 'Follow'}</button><button className="button button-primary" disabled={busyUsers.includes(person.id)} onClick={() => toggleRelation(person, 'connect')}>{person.is_connected ? 'Connected' : 'Connect'}</button></div></div>
          </article>)}</div> : <div className="panel network-empty"><h2>{tab === 'people' ? 'No people found.' : tab === 'connections' ? 'Your connections will appear here.' : 'You are not following anyone yet.'}</h2><p>{tab === 'people' ? 'Try another name or email.' : 'Discover candidates and employers to grow your professional network.'}</p>{tab !== 'people' && <button className="button button-secondary" onClick={() => setTab('people')}>Discover people</button>}</div>}
      </div>
      <aside className="network-sidebar">
        <div className="panel network-info"><span className="section-kicker">A LITTLE ABOUT THIS SPACE</span><h2>Work worth sharing.</h2><p>Follow interesting people, connect instantly, and share professional updates with the RecruitPro community.</p><ul><li>Only signed-in members can see posts</li><li>Share text or one image up to 5 MB</li><li>You can delete your own posts</li></ul></div>
        <Link className="network-jobs-link" to="/">Looking for your next role? <strong>Browse jobs →</strong></Link>
      </aside>
    </div>
  </section>
}
