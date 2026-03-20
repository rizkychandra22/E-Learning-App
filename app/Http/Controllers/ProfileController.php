<?php

namespace App\Http\Controllers;

use App\Http\Requests\Profile\UpdateProfileRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(): Response
    {
        $user = auth()->user();
        abort_if(!$user, 403);

        return Inertia::render('Profile/Edit', [
            'profile' => [
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'role' => $user->role,
                'code' => $user->code,
                'profile_photo_url' => $user->profile_photo_path ? Storage::disk('public')->url($user->profile_photo_path) : null,
            ],
        ]);
    }

    public function update(UpdateProfileRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_if(!$user, 403);

        $payload = $request->validated();
        $removePhoto = (bool) ($payload['remove_profile_photo'] ?? false);
        $newPhoto = $request->file('profile_photo');

        unset($payload['profile_photo'], $payload['remove_profile_photo']);

        if (blank($payload['password'] ?? null)) {
            unset($payload['password']);
        }

        if ($removePhoto && $user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);
            $payload['profile_photo_path'] = null;
        }

        if ($newPhoto) {
            if ($user->profile_photo_path) {
                Storage::disk('public')->delete($user->profile_photo_path);
            }

            $payload['profile_photo_path'] = $newPhoto->store('profile-photos', 'public');
        }

        $user->update($payload);

        return back()->with('success', 'Profil berhasil diperbarui.');
    }
}
