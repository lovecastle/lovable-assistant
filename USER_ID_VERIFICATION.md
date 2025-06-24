# User ID Verification

## Issue Found
Different user IDs were being stored in `conversations` and `user_preferences` tables due to inconsistent user ID retrieval methods.

## Root Cause
The problem was in the `MasterAuthService.getCurrentUser()` method:

```javascript
// PROBLEMATIC CODE (before fix):
user: {
  id: this.currentUser.id,        // Auth user ID
  email: this.currentUser.email,
  ...this.userProfile             // This spread overwrote the id!
}
```

The `userProfile` object contains:
- `id`: Profile table record ID (UUID)
- `auth_user_id`: Reference to Supabase Auth user ID

When spreading `...this.userProfile`, the profile's `id` was overwriting `this.currentUser.id`.

## Fix Applied
Changed the order to ensure auth user ID takes precedence:

```javascript
// FIXED CODE:
user: {
  ...this.userProfile,
  id: this.currentUser.id,        // Auth user ID always takes precedence
  email: this.currentUser.email
}
```

## Verification Steps
1. **Check current user ID consistency**:
   ```javascript
   // In browser console on Lovable.dev:
   chrome.runtime.sendMessage({action: 'masterAuth_getCurrentUser'}, (response) => {
     console.log('getCurrentUser ID:', response.user.id);
   });
   ```

2. **Database verification**:
   ```sql
   -- Check if user_id is consistent across tables
   SELECT 'conversations' as table_name, user_id, COUNT(*) 
   FROM conversations 
   WHERE user_id = 'YOUR_USER_ID'
   GROUP BY user_id
   
   UNION ALL
   
   SELECT 'user_preferences' as table_name, user_id, COUNT(*) 
   FROM user_preferences 
   WHERE user_id = 'YOUR_USER_ID'
   GROUP BY user_id;
   ```

## Prevention
- All service worker handlers now use `masterAuth.getCurrentUser()` consistently
- Session token authentication ensures proper user context
- Fixed method ensures auth user ID is always returned

## Tables Affected
- ✅ `conversations` - Now uses consistent user ID
- ✅ `user_preferences` - Now uses consistent user ID  
- ✅ `prompt_templates` - Uses consistent user ID
- ✅ `project_manager` - Uses consistent user ID

## Data Migration
If there are existing records with inconsistent user IDs, they would need to be migrated:

```sql
-- Example migration (DO NOT RUN without verification):
-- UPDATE conversations 
-- SET user_id = 'CORRECT_AUTH_USER_ID' 
-- WHERE user_id = 'INCORRECT_PROFILE_ID';
```