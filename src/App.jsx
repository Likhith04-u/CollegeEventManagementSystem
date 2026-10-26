import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import api from "./api";

const categories = ["All", "Workshop", "Seminar", "FDP", "Technical Event", "Other"];

function dateLabel(date) {
  return new Date(date).toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric"
  });
}

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("campusconnect_user") || "null"); }
    catch { return null; }
  });
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [eventForm, setEventForm] = useState({
    title: "", description: "", category: "Workshop", date: "", time: "10:00",
    venue: "", organizer: "", capacity: 50
  });
  const [editingId, setEditingId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const navigate = useNavigate();

  const loadEvents = useCallback(async () => {
    try {
      const { data } = await api.get("/events");
      setEvents(data.events || []);
    } catch { setError("Cannot load events. Make sure the backend and MongoDB are running."); }
  }, []);

  const loadRegistrations = useCallback(async () => {
    if (!user || user.role !== "student") return;
    try {
      const { data } = await api.get("/registrations/mine");
      setRegistrations(data.registrations || []);
    } catch { /* signed-in state may have expired */ }
  }, [user]);

  useEffect(() => { loadEvents(); }, [loadEvents]);
  useEffect(() => { loadRegistrations(); }, [loadRegistrations]);

  const visibleEvents = useMemo(() => events.filter((event) => {
    const search = query.trim().toLowerCase();
    const matchesText = !search || [event.title, event.description, event.venue, event.organizer]
      .some((value) => (value || "").toLowerCase().includes(search));
    return matchesText && (category === "All" || event.category === category);
  }), [events, query, category]);

  function setField(setter, field, value) {
    setter((current) => ({ ...current, [field]: value }));
  }

  async function submitAuth(event) {
    event.preventDefault(); setError(""); setNotice("");
    try {
      const endpoint = authMode === "register" ? "/auth/register" : "/auth/login";
      const { data } = await api.post(endpoint, authForm);
      if (authMode === "register") {
        setNotice("Account created. Please sign in.");
        setAuthMode("login");
        setAuthForm((f) => ({ ...f, password: "" }));
      } else {
        localStorage.setItem("campusconnect_token", data.token);
        localStorage.setItem("campusconnect_user", JSON.stringify(data.user));
        setUser(data.user);
        setNotice(`Welcome, ${data.user.name}!`);
        setAuthForm({ name: "", email: "", password: "" });
        navigate(data.user.role === "admin" ? "/admin" : "/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed. Check the backend connection.");
    }
  }

  function logout() {
    localStorage.removeItem("campusconnect_token");
    localStorage.removeItem("campusconnect_user");
    setUser(null); setRegistrations([]); setParticipants([]);
    setNotice("You have been signed out."); navigate("/");
  }

  async function registerForEvent(eventId) {
    setError(""); setNotice("");
    if (!user) { navigate("/auth"); setError("Sign in before registering for an event."); return; }
    if (user.role !== "student") { setError("Student accounts are required to register for events."); return; }
    try {
      const { data } = await api.post("/registrations", { eventId });
      setNotice(data.message || "Registration successful.");
      await Promise.all([loadEvents(), loadRegistrations()]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to register for this event.");
    }
  }

  async function cancelRegistration(registrationId) {
    try {
      const { data } = await api.patch(`/registrations/${registrationId}/cancel`);
      setNotice(data.message || "Registration cancelled.");
      await Promise.all([loadEvents(), loadRegistrations()]);
    } catch (err) { setError(err.response?.data?.message || "Unable to cancel registration."); }
  }

  function resetEventForm() {
    setEditingId(null);
    setEventForm({
      title: "", description: "", category: "Workshop", date: "", time: "10:00",
      venue: "", organizer: "", capacity: 50
    });
  }

  async function saveEvent(event) {
    event.preventDefault(); setError(""); setNotice("");
    try {
      const payload = { ...eventForm, capacity: Number(eventForm.capacity) };
      if (editingId) await api.put(`/events/${editingId}`, payload);
      else await api.post("/events", payload);
      setNotice(editingId ? "Event updated." : "Event created.");
      resetEventForm(); await loadEvents();
    } catch (err) { setError(err.response?.data?.message || "Unable to save event. Admin login is required."); }
  }

  function editEvent(event) {
    setEditingId(event._id);
    setEventForm({
      title: event.title || "", description: event.description || "", category: event.category || "Other",
      date: event.date ? new Date(event.date).toISOString().slice(0, 10) : "",
      time: event.time || "10:00", venue: event.venue || "", organizer: event.organizer || "",
      capacity: event.capacity || 1
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteEvent(id) {
    if (!window.confirm("Delete this event? Related registrations will also be removed.")) return;
    try {
      await api.delete(`/events/${id}`);
      setNotice("Event deleted."); await loadEvents();
    } catch (err) { setError(err.response?.data?.message || "Unable to delete event."); }
  }

  async function showParticipants(eventId) {
    try {
      const { data } = await api.get(`/registrations/event/${eventId}`);
      setParticipants(data.registrations || []);
    } catch (err) { setError(err.response?.data?.message || "Unable to load participants."); }
  }

  async function updateParticipantStatus(id, status) {
    try {
      await api.patch(`/registrations/${id}/status`, { status });
      const selectedEvent = participants[0]?.event?._id;
      if (selectedEvent) await showParticipants(selectedEvent);
      setNotice("Registration status updated.");
    } catch (err) { setError(err.response?.data?.message || "Unable to update registration."); }
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">C</span>
          <span>Campus<span className="brand-accent">Connect</span><small>COLLEGE EVENTS</small></span>
        </Link>
        <nav>
          <Link to="/">Explore events</Link>
          {user?.role === "student" && <Link to="/history">My registrations</Link>}
          {isAdmin && <Link to="/admin">Admin dashboard</Link>}
          {!user ? <Link className="nav-cta" to="/auth">Sign in</Link> :
            <button className="nav-cta" onClick={logout}>Sign out</button>}
        </nav>
      </header>

      <main className="container">
        {notice && <div className="alert success"><span>{notice}</span><button onClick={() => setNotice("")}>×</button></div>}
        {error && <div className="alert danger"><span>{error}</span><button onClick={() => setError("")}>×</button></div>}

        <Routes>
          <Route path="/" element={
            <>
              <section className="hero">
                <div className="hero-copy">
                  <span className="eyebrow"><span className="pulse-dot"></span> YOUR CAMPUS, YOUR COMMUNITY</span>
                  <h1>Ideas become<br /><span>experiences.</span></h1>
                  <p>Discover workshops, seminars and campus events that spark your curiosity and bring your community together.</p>
                  <a href="#events" className="primary-button">Explore upcoming events <span>↘</span></a>
                  <div className="hero-stats">
                    <div><strong>{events.length}</strong><small>Events listed</small></div>
                    <div><strong>{events.filter((e) => new Date(e.date) >= new Date()).length}</strong><small>Coming up</small></div>
                    <div><strong>4+</strong><small>Event categories</small></div>
                  </div>
                </div>
                <div className="hero-art" aria-label="Campus event illustration">
                  <div className="art-circle"></div><div className="art-orbit orbit-one"></div><div className="art-orbit orbit-two"></div>
                  <div className="art-card card-top"><span>✦</span><div><b>Learn something new</b><small>One event at a time</small></div></div>
                  <div className="art-center"><span className="art-spark">✳</span><span className="art-person">♟</span><span className="art-caption">MEET · LEARN · GROW</span></div>
                  <div className="art-card card-bottom"><span className="mini-avatars">● ● ●</span><div><b>Find your people</b><small>Make campus memories</small></div></div>
                  <span className="floating-star star-a">✳</span><span className="floating-star star-b">✦</span>
                </div>
              </section>

              <section id="events" className="events-section">
                <div className="section-heading">
                  <div><span className="eyebrow">WHAT'S HAPPENING</span><h2>Find your next <span>big thing.</span></h2></div>
                  <span className="result-count">{visibleEvents.length} events found</span>
                </div>
                <div className="filters">
                  <label className="search-box"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events, topics, venues..." /></label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
                    {categories.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
                {visibleEvents.length ? <div className="event-grid">
                  {visibleEvents.map((event) => {
                    const full = event.registeredCount >= event.capacity;
                    const registered = registrations.some((r) => r.event?._id === event._id && r.status === "Registered");
                    return <article className="event-card" key={event._id}>
                      <div className={`event-cover cover-${categories.indexOf(event.category) % 4}`}>
                        <span className="category-pill">{event.category}</span><span className="cover-symbol">{event.category === "Workshop" ? "✳" : event.category === "Seminar" ? "◉" : event.category === "FDP" ? "✧" : "⌘"}</span>
                        <span className="cover-date">{dateLabel(event.date)}</span>
                      </div>
                      <div className="event-card-body">
                        <div className="event-meta"><span>◷ {event.time}</span><span>♧ {Math.max(0, event.capacity - (event.registeredCount || 0))} seats left</span></div>
                        <h3>{event.title}</h3><p>{event.description}</p>
                        <div className="event-location"><span>⌖</span><span>{event.venue}<small>Organized by {event.organizer}</small></span></div>
                        <div className="event-actions">
                          <button disabled={full || registered} onClick={() => registerForEvent(event._id)} className="primary-button small">{registered ? "Registered ✓" : full ? "Event full" : "Register now ↗"}</button>
                          {isAdmin && <button className="text-button" onClick={() => showParticipants(event._id)}>Participants</button>}
                        </div>
                        {isAdmin && <div className="admin-card-actions"><button onClick={() => editEvent(event)}>Edit</button><button onClick={() => deleteEvent(event._id)}>Delete</button></div>}
                      </div>
                    </article>;
                  })}
                </div> : <div className="empty-state"><span>✳</span><h3>No events found just yet</h3><p>Try another search or check back later for new campus experiences.</p>{isAdmin && <Link className="primary-button small" to="/admin">Create the first event</Link>}</div>}
              </section>
              {isAdmin && participants.length > 0 && <section className="panel participants-panel"><h2>Participants</h2><ParticipantTable participants={participants} onStatus={updateParticipantStatus} /></section>}
            </>
          } />
          <Route path="/auth" element={user ? <Navigate to={isAdmin ? "/admin" : "/"} replace /> :
            <section className="auth-layout">
              <div className="auth-intro"><span className="eyebrow">WELCOME TO CAMPUSCONNECT</span><h1>Your next chapter<br />starts <span>here.</span></h1><p>Sign in to reserve your spot, track registrations and stay connected with campus life.</p><div className="auth-note">✦ &nbsp; Discover. Register. Experience.</div></div>
              <form className="auth-card" onSubmit={submitAuth}>
                <div className="auth-tabs"><button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Sign in</button><button type="button" className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>Create account</button></div>
                <h2>{authMode === "login" ? "Welcome back" : "Join the community"}</h2><p>{authMode === "login" ? "Enter your details to continue." : "Create a student account to get started."}</p>
                {authMode === "register" && <label>Full name<input required value={authForm.name} onChange={(e) => setField(setAuthForm, "name", e.target.value)} placeholder="Your full name" /></label>}
                <label>Email address<input required type="email" value={authForm.email} onChange={(e) => setField(setAuthForm, "email", e.target.value)} placeholder="you@college.edu" /></label>
                <label>Password<input required minLength={8} type="password" value={authForm.password} onChange={(e) => setField(setAuthForm, "password", e.target.value)} placeholder="At least 8 characters" /></label>
                <button className="primary-button full-width" type="submit">{authMode === "login" ? "Sign in →" : "Create account →"}</button>
                <small className="auth-footnote">Admin access is available using an administrator account configured by the project owner.</small>
              </form>
            </section>
          } />
          <Route path="/history" element={!user ? <Navigate to="/auth" replace /> : user.role !== "student" ? <Navigate to="/admin" replace /> :
            <section className="page-section"><div className="section-heading"><div><span className="eyebrow">YOUR ACTIVITY</span><h2>My <span>registrations.</span></h2></div><span className="result-count">{registrations.length} total</span></div>
              {registrations.length ? <div className="history-list">{registrations.map((r) => <article className="history-item" key={r._id}><div className="history-date"><b>{new Date(r.event?.date || r.createdAt).getDate()}</b><span>{new Date(r.event?.date || r.createdAt).toLocaleDateString(undefined, { month: "short" })}</span></div><div className="history-main"><span className="category-text">{r.event?.category || "Event"}</span><h3>{r.event?.title || "Event removed"}</h3><p>⌖ {r.event?.venue || "—"} &nbsp; · &nbsp; ◷ {r.event?.time || "—"}</p></div><div className="history-status"><span className={`status-badge ${r.status === "Registered" ? "status-good" : "status-muted"}`}>{r.status}</span>{r.status === "Registered" && <button className="text-button" onClick={() => cancelRegistration(r._id)}>Cancel</button>}</div></article>)}</div> : <div className="empty-state"><span>↗</span><h3>Your event journey starts here</h3><p>Register for an event and it will appear in your history.</p><Link to="/" className="primary-button small">Browse events</Link></div>}
            </section>
          } />
          <Route path="/admin" element={!user ? <Navigate to="/auth" replace /> : !isAdmin ? <Navigate to="/" replace /> :
            <section className="page-section admin-page">
              <div className="section-heading"><div><span className="eyebrow">CONTROL CENTER</span><h2>Admin <span>dashboard.</span></h2></div><span className="status-badge status-good">Administrator</span></div>
              <div className="admin-stats"><div className="stat-card"><small>Total events</small><strong>{events.length}</strong><span>Across all categories</span></div><div className="stat-card"><small>Total registrations</small><strong>{events.reduce((sum, e) => sum + (e.registeredCount || 0), 0)}</strong><span>All listed events</span></div><div className="stat-card"><small>Upcoming events</small><strong>{events.filter((e) => new Date(e.date) >= new Date()).length}</strong><span>Scheduled ahead</span></div></div>
              <div className="panel"><div className="panel-heading"><div><span className="eyebrow">EVENT MANAGEMENT</span><h2>{editingId ? "Edit event" : "Create an event"}</h2></div>{editingId && <button className="text-button" onClick={resetEventForm}>Cancel edit</button>}</div>
                <form className="event-form" onSubmit={saveEvent}>
                  <label>Event title<input required value={eventForm.title} onChange={(e) => setField(setEventForm, "title", e.target.value)} placeholder="e.g. AI Innovation Workshop" /></label>
                  <label>Category<select value={eventForm.category} onChange={(e) => setField(setEventForm, "category", e.target.value)}>{categories.slice(1).map((c) => <option key={c}>{c}</option>)}</select></label>
                  <label className="span-2">Description<textarea required rows="3" value={eventForm.description} onChange={(e) => setField(setEventForm, "description", e.target.value)} placeholder="What will participants learn?" /></label>
                  <label>Date<input required type="date" min={new Date().toISOString().slice(0, 10)} value={eventForm.date} onChange={(e) => setField(setEventForm, "date", e.target.value)} /></label>
                  <label>Time<input required type="time" value={eventForm.time} onChange={(e) => setField(setEventForm, "time", e.target.value)} /></label>
                  <label>Venue<input required value={eventForm.venue} onChange={(e) => setField(setEventForm, "venue", e.target.value)} placeholder="Auditorium / Lab" /></label>
                  <label>Organizer<input required value={eventForm.organizer} onChange={(e) => setField(setEventForm, "organizer", e.target.value)} placeholder="Department / Club" /></label>
                  <label>Capacity<input required type="number" min="1" max="10000" value={eventForm.capacity} onChange={(e) => setField(setEventForm, "capacity", e.target.value)} /></label>
                  <div className="form-actions"><button type="submit" className="primary-button">{editingId ? "Save changes →" : "Publish event →"}</button></div>
                </form>
              </div>
              <div className="panel"><div className="panel-heading"><div><span className="eyebrow">YOUR CALENDAR</span><h2>Manage events</h2></div></div><div className="admin-event-list">{events.map((e) => <div className="admin-event-row" key={e._id}><div className="admin-event-date">{dateLabel(e.date)}</div><div className="admin-event-name"><b>{e.title}</b><small>{e.category} · {e.venue}</small></div><div className="admin-event-count">{e.registeredCount || 0}/{e.capacity} registered</div><div className="row-actions"><button onClick={() => showParticipants(e._id)}>Participants</button><button onClick={() => editEvent(e)}>Edit</button><button className="danger-text" onClick={() => deleteEvent(e._id)}>Delete</button></div></div>)}</div></div>
              {participants.length > 0 && <div className="panel"><div className="panel-heading"><h2>Participant management</h2><button className="text-button" onClick={() => setParticipants([])}>Close</button></div><ParticipantTable participants={participants} onStatus={updateParticipantStatus} /></div>}
            </section>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer><Link className="brand footer-brand" to="/"><span className="brand-mark">C</span><span>Campus<span className="brand-accent">Connect</span></span></Link><span>Made for campus communities · College Event Management System</span></footer>
    </div>
  );
}

function ParticipantTable({ participants, onStatus }) {
  if (!participants.length) return <p className="muted">No participants are registered yet.</p>;
  return <div className="table-wrap"><table><thead><tr><th>Student</th><th>Email</th><th>Registered on</th><th>Status</th><th>Action</th></tr></thead><tbody>
    {participants.map((p) => <tr key={p._id}><td>{p.student?.name || "Unknown"}</td><td>{p.student?.email || "—"}</td><td>{dateLabel(p.createdAt)}</td><td><span className={`status-badge ${p.status === "Registered" ? "status-good" : "status-muted"}`}>{p.status}</span></td><td>{p.status === "Registered" ? <button className="text-button" onClick={() => onStatus(p._id, "Cancelled")}>Cancel</button> : <button className="text-button" onClick={() => onStatus(p._id, "Registered")}>Restore</button>}</td></tr>)}
  </tbody></table></div>;
}

export default App;