document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);
    document.querySelector('#change_password').addEventListener('click', change_password_form);
  
    // send email
    document.querySelector('#compose-form').addEventListener('submit', function(event) {
      event.preventDefault();
      send_email();
    });

    // change password
    document.querySelector('#change_password_form').addEventListener('submit', function(event) {
      event.preventDefault();
      change_password();
    });

    // search mailbox
    document.querySelector('#search-form').addEventListener('submit', function(event) {
      event.preventDefault();
      // if user is on a current mailbox, search within the folder
      if (document.querySelector('#emails-view').style.display == 'block') {
        current_mailbox = document.getElementById('current_mailbox').innerHTML.toLowerCase();
      } // else auto search inbox
      else {
        current_mailbox = 'inbox';
      }
      search_mailbox(current_mailbox);
    });
  
    // By default, load the inbox
    load_mailbox('inbox');
  });
  
  // load the compose email forms
  function compose_email() {
  
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#emails-detail').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#change_password_view').style.display = 'none';
  
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }

  // load the change password forms
  function change_password_form() {
  
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#emails-detail').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#change_password_view').style.display = 'block';
  
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }
  
  // loads the corresponsding mailbox
  function load_mailbox(mailbox) {
    
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#emails-detail').style.display = 'none';
    document.querySelector('#change_password_view').style.display = 'none';
  
    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3 id='current_mailbox'>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
    // call API to get corresponsding mailbox
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      emails.forEach(email => {
        create_email_list(email, mailbox);
      });
      console.log(emails);
    });
  }
  
  // print out email list
  function create_email_list(email, mailbox) {
        // parent div for each email
        const each_email = document.createElement('div');
        each_email.setAttribute('class', 'email_list');
        each_email.addEventListener('click', () => view_email(email)); // click to view email in details
  
        // change email color if read
        if ((mailbox == 'inbox' || mailbox == 'archive'|| mailbox == 'sent') && email["read"] == true) {
          each_email.setAttribute('style', 'background-color: lightgray');
        }
  
        // child div for email sender
        const sender = document.createElement('div');
        sender.setAttribute('class', 'sender');
        if (mailbox == 'sent') {
          sender.innerHTML = `To: ${email["recipients"]}`;
        } 
        else {
          sender.innerHTML = `From: ${email["sender"]}`;
        }
        
        // child div for email subject
        const subject = document.createElement('div');
        subject.setAttribute('class', 'subject');
        subject.innerHTML = email["subject"];

        // child div for email timestamp
        const timestamp = document.createElement('div');
        timestamp.setAttribute('class', 'timestamp');
        timestamp.innerHTML = email["timestamp"];
  
        // clear float for this email
        const clear_float = document.createElement('div');
        clear_float.setAttribute('class', 'clear_float');
  
        // append email to body
        each_email.append(sender);
        each_email.append(subject);
        each_email.append(timestamp);
        each_email.append(clear_float);
        document.querySelector('#emails-view').append(each_email);
  }
  
  // view each email once clicked on
  function view_email(email) {
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#emails-detail').style.display = 'block';
    document.querySelector('#change_password_view').style.display = 'none';

    // clear email lists
    document.querySelector('#emails-detail').innerHTML = '';
  
    // call API to get corresponsding email
    fetch(`/emails/${email["id"]}`, {
        method: "GET"
    })
    .then(response => response.json())
    .then(email => {
      create_email_view(email);
      console.log(email);
    });

    // call API to mark email as read if email is not read
    if (!email["read"]) {
        fetch(`/emails/${email["id"]}`, {
            method: "PUT",
            headers: {
              'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                read: true
            })
        })
        .then(response => response.text())
        .then(result => {
            console.log(result);
        });
    }
    
  }
  
  // print out current email
  function create_email_view(email) {
    // sender
    const sender = document.createElement('div');
    sender.setAttribute('class', 'title');
    sender.innerHTML = "From: ";
    const sender_content = document.createElement('span');
    sender_content.setAttribute('style', 'font-weight: normal');
    sender_content.innerHTML = email["sender"]; 
    sender.append(sender_content);
  
    // recipients
    const receiver = document.createElement('div');
    receiver.setAttribute('class', 'title');
    receiver.innerHTML = "To: ";
    const receiver_content = document.createElement('span');
    receiver_content.setAttribute('style', 'font-weight: normal');
    receiver_content.innerHTML = email["recipients"]; 
    receiver.append(receiver_content);
  
    // subject
    const subject = document.createElement('div');
    subject.setAttribute('class', 'title');
    subject.innerHTML = "Subject: ";
    const subject_content = document.createElement('span');
    subject_content.setAttribute('style', 'font-weight: normal');
    subject_content.innerHTML = email["subject"]; 
    subject.append(subject_content);
  
    // timestamp
    const timestamp = document.createElement('div');
    timestamp.setAttribute('class', 'title');
    timestamp.innerHTML = "Sender: ";
    const timestamp_content = document.createElement('span');
    timestamp_content.setAttribute('style', 'font-weight: normal');
    timestamp_content.innerHTML = email["timestamp"]; 
    timestamp.append(timestamp_content);
  
    // reply button
    const reply_button = document.createElement('button');
    reply_button.setAttribute('class', 'btn btn-sm btn-outline-primary');
    reply_button.innerHTML = "Reply";
    reply_button.addEventListener('click', () => reply_email(email)); // call reply function

    // archived button only applies to email sent to current users
    const archived_button = document.createElement('button');
    archived_button.setAttribute('class', 'btn btn-sm btn-outline-primary');
    archived_button.addEventListener('click', () => archived_email(email)); // call archived function
    archived_button.setAttribute('style', 'margin-left: 1%;');

    // delete button only applies to email sent to current users
    const delete_button = document.createElement('button');
    delete_button.setAttribute('class', 'btn btn-sm btn-outline-primary');
    delete_button.innerHTML = "Delete";
    delete_button.addEventListener('click', () => delete_email(email)); // call archived function
    delete_button.setAttribute('style', 'margin-left: 1%;');

    const hr = document.createElement('hr');

    // email body
    const body = document.createElement('div');
    body.setAttribute('class', 'email_body');
    body.innerHTML = email["body"];
  
    // attach all to body
    document.querySelector('#emails-detail').append(sender);
    document.querySelector('#emails-detail').append(receiver);
    document.querySelector('#emails-detail').append(subject);
    document.querySelector('#emails-detail').append(timestamp);
    // only allow reply and archive on inbox or archive
    if (email["recipients"].includes(document.querySelector('#user_email').innerHTML)) { 
      if (!email["archived"]) {
        archived_button.innerHTML = "Archived";
      } 
      else {
        archived_button.innerHTML = "Unarchived ";
      }
      document.querySelector('#emails-detail').append(reply_button);
      document.querySelector('#emails-detail').append(archived_button);
      document.querySelector('#emails-detail').append(delete_button);
    }
    // else allow delete on sent
    else {
      document.querySelector('#emails-detail').append(delete_button);
    }
    document.querySelector('#emails-detail').append(hr);
    document.querySelector('#emails-detail').append(body);
  }
  
  // allow user to reply to email
  function reply_email(email) {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#emails-detail').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#change_password_view').style.display = 'none';
  
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = email["sender"];
    if (email["subject"].startsWith('Re:')) {
      document.querySelector('#compose-subject').value = email["subject"];
    }
    else {
      document.querySelector('#compose-subject').value = `Re: ${email["subject"]}`;
    }
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
  }

  // call API to send emails
  function send_email() {
    // get required fields
    let recipients = document.querySelector('#compose-recipients').value;
    let subject = document.querySelector('#compose-subject').value;
    let body = document.querySelector('#compose-body').value;

    if (subject == '' || body == '') {
      if (confirm('You are about to send an email without subject or body. Do you want to proceed?')) {
        // send data to server
        fetch('/emails', {
          method: 'POST',
          headers: {
            'X-CSRFToken': getCookie('csrftoken')
          },
          body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body
          })
        })
        // parse returned data in JSON and return sent mailbox
        .then(response => response.json().then(data => ({
          status: response.status,
          body: data
        })))
        .then(result => {
          if (result.status == 201) {
            load_mailbox('sent');
            console.log(result);
            console.log(response);
          } else {
            alert(result.body.error);
          }
          
        })
      }
    } else {
      // send data to server
      fetch('/emails', {
        method: 'POST',
        headers: {
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body
        })
      })
      // parse returned data in JSON and return sent mailbox
      .then(response => response.json().then(data => ({
        status: response.status,
        body: data
      })))
      .then(result => {
        if (result.status == 201) {
          load_mailbox('sent');
          console.log(result);
          console.log(response);
        } else {
          alert(result.body.error);
        }
        
      })
    }
  }
  
  // archived or unarchived emails
  function archived_email(email) {
    fetch(`/emails/${email["id"]}`, {
      method: "PUT",
      headers: {
        'X-CSRFToken': getCookie('csrftoken')
      },
      body: JSON.stringify({
        archived: (!email["archived"] ? true : false)
      })
    })
    .then(response => response.text())
    .then(result => {
      console.log(result);
      // load_mailbox('inbox');
      view_email(email);
    })
  }

  // delete emails
  function delete_email(email) {
    fetch(`/emails_delete/${email["id"]}`, {
      method: "POST",
      headers: {
        'X-CSRFToken': getCookie('csrftoken')
      }
    })
    .then(response => response.text())
    .then(result => {
      console.log(result);
      // load_mailbox('inbox');
      current_mailbox = document.getElementById('current_mailbox').innerHTML.toLowerCase();
      load_mailbox(current_mailbox);
    })
  }

  // search the corresponsding mailbox
  function search_mailbox(mailbox) {
    
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#emails-detail').style.display = 'none';
    document.querySelector('#change_password_view').style.display = 'none';

    // get search query
    let query = document.querySelector('#query').value;
  
    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3 id='current_mailbox'>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
    // call API to get corresponsding mailbox
    fetch(`/emails_search/${mailbox}`, {
      method: "POST",
      headers: {
        'X-CSRFToken': getCookie('csrftoken')
      },
      body: JSON.stringify({
        query: query
      })
    })
    .then(response => response.json())
    .then(emails => {
      emails.forEach(email => {
        create_email_list(email, mailbox);
      });
      console.log(emails);
    });
  }

  // call API to change password
  function change_password() {
    // get required fields
    let old_password = document.querySelector('#change_password_old').value;
    let new_password = document.querySelector('#change_password_new').value;
    let confirm = document.querySelector('#change_password_confirm').value;
  
    // send data to server
    fetch('/emails_change_password', {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCookie('csrftoken')
      },
      body: JSON.stringify({
        old_password: old_password,
        new_password: new_password,
        confirm: confirm
      })
    })
    // parse returned data in JSON and return sent mailbox
    .then(response => response.json().then(data => ({
      status: response.status,
      body: data
    })))
    .then(result => {
      if (result.status == 201) {
        alert(result.body.message);
        location.reload();
      } else {
        alert(result.body.error);
      }
      
    })
  }
  
  // get csrf_token
function getCookie(name) {
  var cookieValue = null;
  if (document.cookie && document.cookie != '') {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
          var cookie = cookies[i].trim();
          // Does this cookie string begin with the name we want?
          if (cookie.substring(0, name.length + 1) == (name + '=')) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
          }
      }
  }
  return cookieValue;
}
  