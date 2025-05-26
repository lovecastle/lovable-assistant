// Constraint Violation Test Script
// Run this in the browser console to test constraint violation handling

(function testConstraintViolationHandling() {
  console.log('🧪 Testing constraint violation handling...');
  
  // Test data with duplicate lovable_message_id
  const testConversation = {
    id: 'test-conversation-' + Date.now(),
    projectId: 'test-project',
    userMessage: 'Test user message for constraint violation testing',
    lovableResponse: 'Test Lovable response for constraint violation testing',
    timestamp: new Date().toISOString(),
    projectContext: {
      messageGroupId: 'test-group-' + Date.now(),
      userId: 'test-user-id',
      lovableId: 'duplicate-lovable-id-for-testing', // This should trigger constraint violation
      autoCapture: false
    },
    categories: ['Testing', 'Debugging']
  };
  
  // Test 1: Save conversation (first time should succeed)
  chrome.runtime.sendMessage({
    action: 'saveConversation',
    data: testConversation
  }).then(response => {
    console.log('🧪 Test 1 - First save result:', response);
    
    if (response.success && !response.skipped) {
      console.log('✅ Test 1 passed: First save succeeded');
      
      // Test 2: Save same conversation again (should be skipped due to constraint)
      const duplicateConversation = {
        ...testConversation,
        id: 'test-conversation-duplicate-' + Date.now(), // Different ID but same lovableId
        userMessage: 'Different user message but same lovable_message_id'
      };
      
      chrome.runtime.sendMessage({
        action: 'saveConversation', 
        data: duplicateConversation
      }).then(duplicateResponse => {
        console.log('🧪 Test 2 - Duplicate save result:', duplicateResponse);
        
        if (duplicateResponse.success && duplicateResponse.skipped) {
          console.log('✅ Test 2 passed: Duplicate was properly skipped');
          console.log('✅ All tests passed! Constraint violation handling is working correctly.');
        } else {
          console.error('❌ Test 2 failed: Duplicate was not properly handled');
          console.log('Expected: { success: true, skipped: true }');
          console.log('Actual:', duplicateResponse);
        }
      }).catch(error => {
        console.error('❌ Test 2 error:', error);
      });
      
    } else if (response.success && response.skipped) {
      console.log('⚠️ Test 1 note: Conversation was skipped (probably already exists from previous test)');
    } else {
      console.error('❌ Test 1 failed:', response);
    }
  }).catch(error => {
    console.error('❌ Test 1 error:', error);
  });
  
  console.log('🧪 Test initiated. Check console for results...');
})();

// Additional debugging commands
console.log(`
🔧 Additional debugging commands:

// Check current database constraint status:
await chrome.runtime.sendMessage({
  action: 'testConnection'
});

// View recent conversations:
await chrome.runtime.sendMessage({
  action: 'getConversations',
  filters: { limit: 5 }
});

// Clear test data (optional):
// await chrome.runtime.sendMessage({
//   action: 'deleteConversations', 
//   filters: { projectId: 'test-project' }
// });
`);
