import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function test() {
  console.log('=== SUPABASE URL:', process.env.SUPABASE_URL?.substring(0, 40));
  
  // Find or create test user
  const { data: existing } = await supabase.auth.admin.listUsers();
  let testUser = existing.users.find(u => u.email === 'test@siteforge.ai');
  
  if (!testUser) {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: 'test@siteforge.ai',
      password: 'TestPass123!',
      email_confirm: true,
      user_metadata: { name: 'Test User', role: 'OWNER' }
    });
    if (error) { console.log('Create error:', error.message); return; }
    testUser = created.user;
    console.log('✅ Created user:', testUser.id);
  } else {
    console.log('✅ Found existing user:', testUser.id);
  }
  
  // Sign in
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@siteforge.ai',
    password: 'TestPass123!'
  });
  
  if (authError) { console.log('❌ Auth error:', authError.message); return; }
  
  const token = authData.session.access_token;
  console.log('✅ Got token');
  
  // Test auth me
  const meRes = await fetch('http://localhost:3001/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const meData = await meRes.json();
  console.log('✅ Auth me:', meData.email || meData.error?.message);
  
  // Create site
  const siteRes = await fetch('http://localhost:3001/api/v1/sites', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      name: 'Cool Air HVAC', 
      description: 'A local HVAC company in Austin',
      industry: 'hvac',
      location: 'Austin, TX'
    })
  });
  const siteData = await siteRes.json();
  console.log('✅ Created site:', siteData.name, '-', siteData.id);
  
  if (siteData.id) {
    // AI generate
    const genRes = await fetch(`http://localhost:3001/api/v1/sites/${siteData.id}/generate`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        prompt: 'A professional website for Cool Air HVAC, a heating and cooling company in Austin, TX. Services include AC repair, heating installation, and maintenance.'
      })
    });
    const genData = await genRes.json();
    console.log('✅ AI generation started:', genData.status);
    
    // Wait for AI
    console.log('⏳ Waiting 8s for AI generation...');
    await new Promise(r => setTimeout(r, 8000));
    
    // Get site with pages
    const getRes = await fetch(`http://localhost:3001/api/v1/sites/${siteData.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getData = await getRes.json();
    console.log('✅ Site has', getData.pages?.length || 0, 'pages');
    console.log('   Name:', getData.name);
    console.log('   Industry:', getData.industry);
    
    (getData.pages || []).forEach(p => {
      console.log('   -', p.name, '(' + (p.sections?.length || 0) + ' sections)');
    });
    
    // AEO score
    const aeoRes = await fetch(`http://localhost:3001/api/v1/sites/${siteData.id}/aeo/score`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const aeoData = await aeoRes.json();
    console.log('✅ AEO Score:', aeoData.overall, '/ 100');
    console.log('   Breakdown:', JSON.stringify(aeoData.breakdown));
    
    // Publish
    const pubRes = await fetch(`http://localhost:3001/api/v1/sites/${siteData.id}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const pubData = await pubRes.json();
    console.log('✅ Published:', pubData.url);
    
    console.log('\n🎉 FULL FLOW COMPLETE');
  }
}

test().catch(e => {
  console.error('❌ Test failed:', e.message);
  process.exit(1);
});
