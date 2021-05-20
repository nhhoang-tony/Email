import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required

from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import HttpResponse, HttpResponseRedirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt, csrf_protect

from .models import User, Email


def index(request):

    # Authenticated users view their inbox
    if request.user.is_authenticated:
        return render(request, "mail/inbox.html")

    # Everyone else is prompted to sign in
    else:
        return HttpResponseRedirect(reverse("login"))


@csrf_protect
@login_required
def compose(request):

    # Composing a new email must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    # Check recipient emails
    data = json.loads(request.body)
    emails = [email.strip() for email in data.get("recipients").split(",")]
    if emails == [""]:
        return JsonResponse({
            "error": "At least one recipient required."
        }, status=400)

    # Convert email addresses to users
    recipients = []
    for email in emails:
        try:
            if "@" not in email:
                email_append = email + '@tonymail.com'
                user = User.objects.get(email=email_append)
            else:
                user = User.objects.get(email=email)
            recipients.append(user)
        except User.DoesNotExist:
            return JsonResponse({
                "error": f"User with email {email} does not exist. \nUse format ('tony' or 'tony@tonymail.com'). To send email to multiple recipients, please separate by comma (tony, tina@tonymail.com)"
            }, status=400)

    # Get contents of email
    subject = data.get("subject", "")
    body = data.get("body", "")

    # Create one email for each recipient, plus sender
    users = set()
    users.add(request.user)
    users.update(recipients)
    for user in users:
        email = Email(
            user=user,
            sender=request.user,
            subject=subject,
            body=body
        )
        email.save()
        for recipient in recipients:
            email.recipients.add(recipient)
        email.save()

    return JsonResponse({"message": "Email sent successfully."}, status=201)

@login_required
def mailbox(request, mailbox):

    # Filter emails returned based on mailbox
    if mailbox == "inbox":
        emails = Email.objects.filter(
            user=request.user, recipients=request.user, archived=False
        )
    elif mailbox == "sent":
        emails = Email.objects.filter(
            user=request.user, sender=request.user
        )
    elif mailbox == "archive":
        emails = Email.objects.filter(
            user=request.user, recipients=request.user, archived=True
        )
    else:
        return JsonResponse({"error": "Invalid mailbox."}, status=400)

    # Return emails in reverse chronologial order
    emails = emails.order_by("-timestamp").all()
    return JsonResponse([email.serialize() for email in emails], safe=False)

@csrf_protect
@login_required
def email_search(request, mailbox):
    if request.method == "POST":
        data = json.loads(request.body)
        query = data["query"]

        # Filter emails returned based on mailbox
        if mailbox == "inbox":
            emails = Email.objects.filter(
                user=request.user, recipients=request.user, archived=False, subject__icontains=query
            )
        elif mailbox == "sent":
            emails = Email.objects.filter(
                user=request.user, sender=request.user, subject__icontains=query
            )
        elif mailbox == "archive":
            emails = Email.objects.filter(
                user=request.user, recipients=request.user, archived=True, subject__icontains=query
            )
        else:
            return JsonResponse({"error": "Invalid mailbox."}, status=400)

        # Return emails in reverse chronologial order
        emails = emails.order_by("-timestamp").all()
        return JsonResponse([email.serialize() for email in emails], safe=False)


@csrf_protect
@login_required
def email(request, email_id):

    # Query for requested email
    try:
        email = Email.objects.get(user=request.user, pk=email_id)
    except Email.DoesNotExist:
        return JsonResponse({"error": "Nice try."}, status=404)

    # Return email contents
    if request.method == "GET":
        return JsonResponse(email.serialize())

    # Update whether email is read or should be archived
    elif request.method == "PUT":
        data = json.loads(request.body)
        if data.get("read") is not None:
            email.read = data["read"]
        if data.get("archived") is not None:
            email.archived = data["archived"]
        email.save()
        return HttpResponse(status=204)

    # Email must be via GET or PUT
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        email = request.POST["email"]
        if "@" not in email:
            email += '@tonymail.com'
        password = request.POST["password"]
        user = authenticate(request, username=email, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "mail/login.html", {
                "message": "Invalid email and/or password."
            })
    else:
        return render(request, "mail/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        email = request.POST["username"]

        # Ensure proper username
        if " " in email or "@" in email:
            return render(request, "mail/register.html", {
                "message": "Username must not contain space or special character '@'."
            })
        email += '@tonymail.com'

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "mail/register.html", {
                "message": "Passwords must match."
            })

        # ensure no empty email or password 
        if email == "" or password == "":
            return render(request, "mail/register.html", {
                "message": "Email or passwords must not be empty."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(email, email, password)
            user.save()
        except IntegrityError as e:
            print(e)
            return render(request, "mail/register.html", {
                "message": "Email address already taken."
            })
        login(request, user)

        welcome = Email.objects.create(user=User.objects.get(email='tony@tonymail.com'), \
            sender=User.objects.get(email='tony@tonymail.com'), \
            subject="Let's get started", \
            body="Get started by replying to this email, send yourself an email, or send us an email to any of the following email addresses: tony@tonymail.com, tina@tonymail.com, alex@tonymail.com and we will get back to you as soon as possible.")
        welcome.recipients.add(user)
        welcome.save()

        welcome = Email.objects.create(user=user, \
            sender=User.objects.get(email='tony@tonymail.com'), \
            subject="Let's get started", \
            body="Get started by replying to this email, send yourself an email, or send us an email to any of the following email addresses: tony@tonymail.com, tina@tonymail.com, alex@tonymail.com and we will get back to you as soon as possible.")
        welcome.recipients.add(user)
        welcome.save()

        welcome = Email.objects.create(user=User.objects.get(email='tony@tonymail.com'), \
            sender=User.objects.get(email='tony@tonymail.com'), \
            subject="Welcome to Tony's mail", \
            body="Thank you for choosing Tony's mail. We hope you enjoy our services.")
        welcome.recipients.add(user)
        welcome.save()

        welcome = Email.objects.create(user=user, \
            sender=User.objects.get(email='tony@tonymail.com'), \
            subject="Welcome to Tony's mail", \
            body="Thank you for choosing Tony's mail. We hope you enjoy our services.")
        welcome.recipients.add(user)
        welcome.save()

        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "mail/register.html")

# allow users to change password
def change_password(request):
    # only allow authenticated user to change password
    if request.user.is_authenticated:

        # if user reach route via POST method as by submitting a form
        if request.method == "POST":
            # get all required fields
            data = json.loads(request.body)

            old_password = data.get("old_password", "")
            new_password = data.get("new_password", "")
            confirmation = data.get("confirm", "")

            # check if user enter correct old password
            if authenticate(request, username=request.user.username, password=old_password) is None:
                return JsonResponse({
                    "error": "Old password is not correct"
                }, status=400)

            # new password must be different from old password
            if old_password == new_password:
                return JsonResponse({
                    "error": "New password must be different from old password"
                }, status=400)

            # Ensure password matches confirmation
            if new_password != confirmation:
                return JsonResponse({
                    "error": "Confirm passwords must match"
                }, status=400)

            # attempt to change password
            user = User.objects.get(username__exact=request.user.username)
            user.set_password(new_password)
            user.save()

            # ask user to log in again
            logout(request)
            return JsonResponse({
                "message": "Successfully change password. Please log in again"
            }, status=201)
    else:
        return HttpResponseRedirect(reverse("login"))


# allow user to delete email
@csrf_protect
@login_required
def email_delete(request, email_id):

    # POST method required
    if request.method == "POST":
        # Query for requested email
        try:
            email = Email.objects.get(user=request.user, pk=email_id)
        except Email.DoesNotExist:
            return JsonResponse({"error": "Nice try."}, status=404)

        Email.objects.get(pk=email_id).delete()
        return HttpResponse(status=204)

    # Email must be via GET or PUT
    else:
        return JsonResponse({
            "error": "POST request required."
        }, status=400)
