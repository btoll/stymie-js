##Test suite 'stymie'
 
###(describe) '#add'
	 it -> 'should reject when no key name is given'
	 it -> 'should add a new key'
	 it -> 'should not add a duplicate key'
 
###(describe) '#generate'
	 it -> 'should generate a passphrase'
 
###(describe) '#get'
	 it -> 'should reject when no key name is given'
	 
###(describe) 'getting a key'
		 it -> 'should be a no-op when a non-existing key is given'
		 it -> 'should return the key values for an existing key'
	 
###(describe) 'getting a field'
		 it -> 'should be a no-op when the field does not exist'
		 it -> 'should return the field value for an existing field'
 
###(describe) '#has'
	 it -> 'should return true when the key exists'
	 it -> 'should return false when the key does not exist'
 
###(describe) 'listing keys'
	 it -> '#list should list all keys'
	 it -> '#ls should be an alias of #list'
 
###(describe) '#rm'
	 it -> 'should be a no-op on a non-existing key'
	 it -> 'should not remove an existing key if selecting `No`'
	 it -> 'should remove an existing key if selecting `Yes`'