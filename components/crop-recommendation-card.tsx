"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

interface CropRecommendationCardProps {
  crop: {
    id: string;
    name: string;
    score: number;
    imageUrl?: string;
    scientificName?: string;
    growthDuration?: number;
    waterRequirement?: number;
    description?: string;
  };
}

export function CropRecommendationCard({ crop }: CropRecommendationCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 w-full">
        {crop.imageUrl ? (
          <div className="absolute inset-0">
            <Image
              src={crop.imageUrl}
              alt={crop.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <span className="text-muted-foreground">No image available</span>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-bold">
          {crop.score}% Match
        </div>
      </div>
      <CardHeader>
        <CardTitle>{crop.name}</CardTitle>
        {crop.scientificName && (
          <CardDescription className="italic">
            {crop.scientificName}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {crop.description && <p className="text-sm">{crop.description}</p>}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {crop.growthDuration && (
            <div>
              <p className="font-medium text-muted-foreground">
                Growth Duration
              </p>
              <p>{crop.growthDuration} days</p>
            </div>
          )}
          {crop.waterRequirement && (
            <div>
              <p className="font-medium text-muted-foreground">Water Need</p>
              <p>{crop.waterRequirement} mm</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button size="sm" className="w-full" asChild>
          <Link href={`/recommendations/${crop.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
