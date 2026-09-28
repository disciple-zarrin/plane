# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.contrib.auth import login
from django.conf import settings

# Module imports
from plane.utils.host import base_host
from plane.utils.ip_address import get_client_ip


def is_android_client(request):
    user_agent = request.META.get("HTTP_USER_AGENT", "")
    return "PlaneAndroid" in user_agent or request.META.get("HTTP_X_PLANE_CLIENT") == "android"


def user_login(request, user, is_app=False, is_admin=False, is_space=False):
    login(request=request, user=user)

    # If is admin cookie set the custom age
    if is_admin:
        request.session.set_expiry(settings.ADMIN_SESSION_COOKIE_AGE)
    elif is_android_client(request):
        request.session.set_expiry(getattr(settings, "ANDROID_SESSION_COOKIE_AGE", 31536000))
        request.session["is_android"] = True

    device_info = {
        "user_agent": request.META.get("HTTP_USER_AGENT", ""),
        "ip_address": get_client_ip(request=request),
        "domain": base_host(request=request, is_app=is_app, is_admin=is_admin, is_space=is_space),
        "is_android": is_android_client(request),
    }
    request.session["device_info"] = device_info
    request.session.save()
    return
