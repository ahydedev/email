// Users: galadriel@lothlorien.com, gandalf@fellowship.com, elrond@rivendell.com

document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  
  // When the user submits the compose email form, send the email
  document.querySelector("#compose-form").onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#open-email').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function send_email() {
  
  // Use fetch to post email in JSON format
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector("#compose-recipients").value,
        subject: document.querySelector("#compose-subject").value,
        body: document.querySelector("#compose-body").value
    })
  })
  
  // Save response
  .then(response => response.json())
  .then(result => {
    
    // Print result
    console.log(result);
    
    // Redirect to sent mailbox sent mailbox
    load_mailbox('sent');
  });

  // Stop default redirect to inbox ( https://stackoverflow.com/questions/2635370/how-to-stop-page-redirect )
  return false;
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#open-email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Fetch emails from selected mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    // Print emails
    console.log(emails);

    // If mailbox is empty, confirm to user
    if (emails.length == 0) {
      document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3> \r\n \r\n <p>This mailbox is empty.</p>`;
    }

    // For each email..
    emails.forEach(email => {

      // Create a containing div (listing sender, subject line, timestamp)
      const message_container = document.createElement('div');
      message_container.innerHTML = `<p class="preview-sender"> ${email.sender} </p><p class="preview-subject"> ${email.subject} </p><p> ${email.timestamp} </p>`;

      // When a message div is selected open email
      message_container.addEventListener('click', function() {
        open_email(email.id, mailbox);
      });

      // Display div in mailbox
      document.querySelector("#emails-view").append(message_container);

      // Set background color to grey if message read
      if (email.read == false && mailbox == "inbox") {
        message_container.className += "unread-item"; 
      } else {
        message_container.className += "read-item"; 
      }
    });
  });
}

function open_email(email_id, mailbox) {

  // Fetch the email 
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {

    // Print email
    console.log(email);

    // Display email contents div in index.html
    document.querySelector('#open-email').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    // Display email details: sender, recipients, subject, timestamp, body
    document.querySelector('#open-email').innerHTML = `<p><b>From:</b> ${email.sender}</p><p><b>To:</b> ${email.recipients}</p><p><b>Subject:</b> ${email.subject}</p><p><b>Sent:</b> ${email.timestamp}</p><hr><textarea class="textarea"> ${email.body}</textarea><hr>`;

    // Add reply button 
    const reply = document.createElement("button");
    reply.innerHTML = "Reply"; 
    reply.className += "btn btn-sm btn-outline-success spaced";
    reply.addEventListener('click', function() {
      reply_to_email(email.id);
    });
    document.querySelector("#open-email").append(reply);

    // Add archive button 
    const archive_toggle = document.createElement("button");
    if (email.archived) {
      archive_toggle.innerHTML = "Unarchive";
    } else {
      archive_toggle.innerHTML = "Archive";
    }  
    archive_toggle.className += "btn btn-sm btn-outline-success spaced";
    archive_toggle.addEventListener('click', function() {
      archive_email(email.id);
    });
    document.querySelector("#open-email").append(archive_toggle);

    // Hide archive button for sent emails
    if (mailbox == "sent") {
      archive_toggle.style.display = 'none';
    }

    // Mark email as read
    fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    })
  });
}

function archive_email(email_id) {
  
  // Fetch email
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {

    // Print email
    console.log(email);
  
    // If the email is archived, unarchive
    if (email.archived) {
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: false
        })
      })

    // If the message is not archived, archive
    } else {
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: true
        })
      })
    }

    // Redirect to inbox
    load_mailbox("inbox");
    location.reload();
  });
}

function reply_to_email(email_id) {

  // Fetch email
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {

    // Print email
    console.log(email);

    // Display email contents div
    document.querySelector('#open-email').style.display = 'none';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Populate recipient field, subject line (Re: (subject)), pre-fill body with ("On (timestamp) (sender) wrote:")
    document.querySelector("#compose-recipients").value = email.sender;
    if (email.subject.includes("Re:")) {
      console.log("Includes re:");
      document.querySelector("#compose-subject").value = `${email.subject}`;  
    } else {
      console.log("No Include re:");
      document.querySelector("#compose-subject").value = `Re: ${email.subject}`;
    }
    document.querySelector("#compose-body").value = `\r\n \r\n On ${email.timestamp} ${email.sender} wrote: \r\n \r\n ${email.body}`;
  })
}