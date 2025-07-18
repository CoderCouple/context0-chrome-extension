// Simple test to inject a button anywhere on ChatGPT
console.log('ContextZero Test: Script starting...');

function createTestButton() {
  console.log('ContextZero Test: Creating test button...');
  
  // Remove existing test button
  const existing = document.getElementById('contextzero-test-button');
  if (existing) {
    existing.remove();
  }
  
  // Create a very visible test button
  const button = document.createElement('div');
  button.id = 'contextzero-test-button';
  button.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 200px;
      height: 100px;
      background: #ff6b35;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: bold;
      border-radius: 10px;
      cursor: pointer;
      z-index: 999999;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      border: 3px solid white;
    ">
      ContextZero Test
    </div>
  `;
  
  button.addEventListener('click', () => {
    alert('ContextZero extension is working!');
  });
  
  document.body.appendChild(button);
  console.log('ContextZero Test: Button created and added to page');
}

// Run immediately
createTestButton();

// Also try after delays
setTimeout(createTestButton, 1000);
setTimeout(createTestButton, 3000);
setTimeout(createTestButton, 5000);

console.log('ContextZero Test: Script completed');