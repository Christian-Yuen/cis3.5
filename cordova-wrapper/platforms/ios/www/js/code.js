const urlParams = new URLSearchParams(window.location.search);
const email = urlParams.get('email');

const code = Math.floor(Math.random()*1000000)
localStorage.setItem('otpCode', code.toString());

function sendMail() {

  var params = {
    email: email,
    code: localStorage.getItem('otpCode'),
  };

  const serviceID = "service_gcekgr6";
  const templateID = "template_2kbzbpp";

    emailjs.send(serviceID, templateID, params)
    .then(res=>{
        document.getElementById("email").value = "";
        document.getElementById("code").value = "";
        console.log(res);
        alert("Your message sent successfully!!")
    })
    .catch(err=>console.log(err));

}

function verifyCode() {
  const userInput = document.getElementById('otpInput').value;
  const storedCode = localStorage.getItem('otpCode');
  console.log(userInput)
  console.log(storedCode)
  
  if (userInput == storedCode) {
    alert('Login successful!');
    localStorage.removeItem('otpCode');
    window.location.href = 'home.html';
  } else {
    alert('Invalid code. Please try again.');
  }
}